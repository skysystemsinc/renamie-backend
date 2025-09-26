import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LineItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}

export class ExtractedInvoiceDataDto {
  @ApiProperty({ example: 'INV-2024-1001' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ example: '2024-09-25' })
  @IsString()
  invoiceDate: string;

  @ApiProperty({ example: 1250.50 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ example: 'Acme Solutions Inc.' })
  @IsString()
  vendorName: string;

  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];
}