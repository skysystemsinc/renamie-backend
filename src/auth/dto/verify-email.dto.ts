import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailVerifyDto {
  @IsString()
  @IsNotEmpty()
  hash: string;
}

export class resetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class updatePasswordDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  currentPassword?: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
