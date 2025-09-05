import { IsOptional, IsString, IsNumber, IsEnum, IsEmail, Min, IsObject, IsDateString } from 'class-validator';
import { PaymentStatus, PaymentMethod } from '../schemas/payment.schema';

export class UpdatePaymentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @IsOptional()
  @IsString()
  stripeChargeId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundedAmount?: number;

  @IsOptional()
  @IsDateString()
  refundedAt?: Date;

  @IsOptional()
  @IsDateString()
  processedAt?: Date;

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
