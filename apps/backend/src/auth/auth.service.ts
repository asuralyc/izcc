import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { LoginDto, RegisterDto } from './auth.dto';

export interface JwtPayload {
  sub: string;
  account: string;
  role: UserRole;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async onModuleInit() {
    await this.ensureAdminAccount();
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { account: email } });
    if (existing) {
      throw new ConflictException('此 email 已經註冊');
    }

    const user = this.users.create({
      account: email,
      email,
      displayName: dto.displayName.trim(),
      passwordHash: await bcrypt.hash(dto.password, 12),
      role: UserRole.User
    });

    await this.users.save(user);
    return this.signUser(user);
  }

  async login(dto: LoginDto) {
    const account = this.normalizeAccount(dto.account);
    const user = await this.users.findOne({ where: { account } });
    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    return this.signUser(user);
  }

  async validateJwt(payload: JwtPayload) {
    return this.users.findOne({ where: { id: payload.sub } });
  }

  toPublicUser(user: User) {
    return {
      id: user.id,
      account: user.account,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    };
  }

  private signUser(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      account: user.account,
      role: user.role
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: this.toPublicUser(user)
    };
  }

  private normalizeAccount(account: string) {
    return account.trim().toLowerCase();
  }

  private async ensureAdminAccount() {
    const account = this.normalizeAccount(
      this.config.get<string>('ADMIN_ACCOUNT') ?? 'admin'
    );
    const password = this.config.get<string>('ADMIN_PASSWORD');

    if (!password) {
      this.logger.warn('ADMIN_PASSWORD 未設定，略過 Admin 帳號初始化');
      return;
    }

    const existing = await this.users.findOne({ where: { account } });
    if (existing) {
      if (existing.role !== UserRole.Admin) {
        existing.role = UserRole.Admin;
        await this.users.save(existing);
      }
      return;
    }

    const admin = this.users.create({
      account,
      email: account.includes('@') ? account : null,
      displayName: 'IZCC Admin',
      passwordHash: await bcrypt.hash(password, 12),
      role: UserRole.Admin
    });

    await this.users.save(admin);
    this.logger.log(`Admin 帳號已建立：${account}`);
  }
}

