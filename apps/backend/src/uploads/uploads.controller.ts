import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../users/user.entity';

const mimeToExt: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }
    })
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('請選擇要上傳的圖片');
    }
    if (!Object.keys(mimeToExt).includes(file.mimetype)) {
      throw new BadRequestException('只接受 jpg、png、webp 或 gif 圖片');
    }

    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? '/var/www/uploads';
    const publicBase = this.config.get<string>('PUBLIC_UPLOAD_BASE_URL') ?? '/uploads';
    const originalExt = extname(file.originalname).toLowerCase();
    const safeExt = Object.values(mimeToExt).includes(originalExt)
      ? originalExt
      : mimeToExt[file.mimetype];
    const filename = `${randomUUID()}${safeExt}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), file.buffer);

    return {
      filename,
      url: `${publicBase.replace(/\/$/, '')}/${filename}`
    };
  }
}

