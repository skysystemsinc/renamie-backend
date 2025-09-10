import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
  @IsNotEmpty()
  password: string;
}
