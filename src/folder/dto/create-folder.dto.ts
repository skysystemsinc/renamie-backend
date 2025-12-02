import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  ValidateIf,
} from 'class-validator';

export class CreateFoldersDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the folder',
    example: 'Renamie folder',
  })
  name: string;
}

export class RenameFileDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'New name for the folder',
    example: 'Updated Folder Name',
  })
  newName: string;
}

export class FormatDto {
  @ApiProperty({ example: 'PDF', description: 'The file format to save' })
  @IsString()
  format: string;
}

export class QuickBookFormatDto {
  @ApiProperty()
  @IsString()
  vendorName: string;

  @ApiProperty()
  @IsNumber()
  paymentAccount: number;

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  customerName: string;

  @ApiProperty()
  @IsString()
  product: string;

  @ApiProperty()
  @IsNumber()
  discount: number;

  @ApiProperty()
  @ValidateIf((o) => o.transactionType === 'Expense')
  @IsNumber()
  expense: number;

  // bill REQUIRED only when transactionType == "Bill"
  @ApiProperty()
  @ValidateIf((o) => o.transactionType === 'Bill')
  @IsNumber()
  bill: number;

  @ApiProperty()
  @IsString()
  transactionType: string;

  @ApiProperty()
  @IsNumber()
  vendorNetTerm: number;
}
