import { IsNotEmpty, IsString } from 'class-validator';

export class EmailVerifyDto {
  @IsString()
  @IsNotEmpty()
  hash: string;
}
