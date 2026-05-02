import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(80)
  displayName!: string;
}

export class LoginDto {
  @IsString()
  @MaxLength(180)
  account!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

