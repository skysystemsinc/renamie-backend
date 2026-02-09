import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  folderCount?: number;

  @IsOptional()
  @IsString()
  fileCount?: number;

  @IsOptional()
  @IsString()
  userCount?: number;

  //
  @IsOptional()
  @IsBoolean()
  emailNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  isSubscriptionCancelled?: boolean;

  // 
  @IsOptional()
  @IsNumber()
  @Min(1000, { message: 'OTP must be a 4-digit number' })
  @Max(9999, { message: 'OTP must be a 4-digit number' })
  otp?: number;

  @IsOptional()
  otpExpires?: Date;
}

