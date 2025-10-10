import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// This DTO is now empty since we only accept the file
export class UploadFileDto {
  // No properties needed - we only accept the file and auto-generate the key
}

export class PresignedUrlDto {
  @ApiProperty({ description: 'File key/path in S3 bucket' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ 
    description: 'URL expiration time in seconds',
    default: 3600
  })
  @IsOptional()
  expiresIn?: number;

  @ApiPropertyOptional({ description: 'Content type of the file' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ 
    description: 'Access control list',
    enum: ['public-read', 'private'],
    default: 'private'
  })
  @IsOptional()
  @IsEnum(['public-read', 'private'])
  acl?: 'public-read' | 'private';

  @ApiPropertyOptional({
    description: 'Mode of file access: "view" or "download"',
    enum: ['view', 'download'],
    default: 'download',
  })
  @IsOptional()
  @IsEnum(['view', 'download'])
  mode?: 'view' | 'download';
}

export class FileOperationDto {
  @ApiProperty({ description: 'File key/path in S3 bucket' })
  @IsString()
  key: string;
}

export class ListFilesDto {
  @ApiPropertyOptional({ description: 'Prefix to filter files' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ description: 'Maximum number of files to return' })
  @IsOptional()
  maxKeys?: number;
}

export class CopyFileDto {
  @ApiProperty({ description: 'Source file key/path' })
  @IsString()
  sourceKey: string;

  @ApiProperty({ description: 'Destination file key/path' })
  @IsString()
  destinationKey: string;
}

export class GenerateUniqueKeyDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  originalName: string;

  @ApiPropertyOptional({ description: 'Prefix for the generated key' })
  @IsOptional()
  @IsString()
  prefix?: string;
}
