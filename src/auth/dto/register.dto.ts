import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the Terms and Conditions' })
  termsConditions: boolean;

  // Privacy Policy acceptance
  @IsBoolean()
  @Equals(true, { message: 'You must acknowledge the Privacy Policy' })
  privacyPolicy: boolean;
}
