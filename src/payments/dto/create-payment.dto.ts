import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsEmail, Min, IsObject } from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  stripePaymentIntentId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}
