import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
