import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}


