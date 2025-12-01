import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

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
  @IsNumber()
  expense: number;

  @ApiProperty()
  @IsString()
  transactionType: string;

  @ApiProperty()
  @IsNumber()
  vendorNetTerm: number;
}
