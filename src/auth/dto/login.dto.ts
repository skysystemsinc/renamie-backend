import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, Max, Min } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email', example: 'test@test.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}


export class VerifyOtpDto {
  @IsEmail()
  email: string;
  
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'OTP must be exactly 4 digits',
  })
  otp: string;
}

export class ResendOtpDto {
  @IsEmail()
  email: string;
}