import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventStatus } from './event.entity';

export class CreateEventDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @IsString()
  content!: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
