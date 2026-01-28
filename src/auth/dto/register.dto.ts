import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Email', example: 'test@test.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'First Name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last Name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Terms and Conditions', example: true })
  @IsBoolean()
  @Equals(true, { message: 'You must accept the Terms and Conditions' })
  termsConditions: boolean;

  // Privacy Policy acceptance
  @ApiProperty({ description: 'Privacy Policy', example: true })
  @IsBoolean()
  @Equals(true, { message: 'You must acknowledge the Privacy Policy' })
  privacyPolicy: boolean;
}
