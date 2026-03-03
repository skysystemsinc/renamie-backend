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
  @IsNumber()
  folderCount?: number;

  @IsOptional()
  @IsNumber()
  fileCount?: number;

  @IsOptional()
  @IsNumber()
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
  @IsString()
  otp?: string;

  @IsOptional()
  otpExpires?: Date;
}

