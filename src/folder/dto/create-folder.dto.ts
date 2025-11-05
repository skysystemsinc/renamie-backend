import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

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

// export class QuickBookFormatDto {
//   @ApiProperty({ example: 'abc', description: 'vendor Name' })
//   @IsString()
//   vendorName: string;

//   @ApiProperty({ example: 'abc', description: 'payment account' })
//   @IsString()
//   paymentAccount: string;

//   @ApiProperty({ example: 'abc', description: 'description' })
//   @IsString()
//   description: string;
// }

export class QuickBookFormatDto {
  @ApiProperty()
  @IsString()
  vendorName: string;

  @ApiProperty()
  @IsString()
  paymentAccount: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}
