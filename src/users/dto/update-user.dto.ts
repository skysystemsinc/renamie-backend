import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
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
}
