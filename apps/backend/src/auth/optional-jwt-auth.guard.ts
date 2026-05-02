import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    _error: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext
  ) {
    return user ?? null;
  }
}

