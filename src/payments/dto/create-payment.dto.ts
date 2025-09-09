import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsEmail, Min, IsObject } from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  planId: string;
}
