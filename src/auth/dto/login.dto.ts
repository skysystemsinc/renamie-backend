import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

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

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @Max(9999)
  otp: number;
}

export class ResendOtpDto {
  @IsEmail()
  email: string;
}