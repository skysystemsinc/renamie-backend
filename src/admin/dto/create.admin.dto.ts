import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateFoldersDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the folder',
    example: 'Renamie folder',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the user creating the folder',
  })
  userId: string;
}


export class FormatDto {
  @ApiProperty({ example: 'PDF', description: 'The file format to save' })
  @IsString()
  format: string;

   @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the user creating the folder',
  })
  userId: string;
}

export class adminRenameFileDto {
      @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the user creating the folder',
  })
  userId: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'New name for the folder',
    example: 'Updated Folder Name',
  })
  newName: string;
}


export class CreateInvitedUserDto {
  
  @ApiProperty({ description: 'Email', example: 'test@test.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First Name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last Name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
