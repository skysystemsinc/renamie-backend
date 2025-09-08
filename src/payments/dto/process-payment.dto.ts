import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsEmail, Min, IsObject, IsMongoId } from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({ description: 'The ID of the plan to process payment for', example: '66d9a4000000000000000000' })
  @IsNotEmpty()
  @IsMongoId()
  planId: string;
}
