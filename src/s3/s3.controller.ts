import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpException,
  HttpStatus,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { S3Service } from '../common/services/s3.service';
import {
  UploadFileDto,
  PresignedUrlDto,
  FileOperationDto,
  ListFilesDto,
  CopyFileDto,
  GenerateUniqueKeyDto,
} from './dto/upload.dto';
import { FolderService } from 'src/folder/services/folder.service';

@ApiTags('S3 File Operations')
@Controller('s3')
export class S3Controller {
  constructor(
    private readonly s3Service: S3Service,
    private readonly folderService: FolderService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const key = this.s3Service.generateUniqueKey(
        file.originalname,
        'uploads/',
      );
      const result = await this.s3Service.uploadFile(key, file.buffer, {
        acl: 'private',
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        message: 'File uploaded successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload-files/:folderId')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Upload multiple files to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadFiles(
    @Param('folderId') folderId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const key = this.s3Service.generateUniqueKey(
            file.originalname,
            'uploads/',
          );

          const s3UploadResult = await this.s3Service.uploadFile(
            key,
            file.buffer,
            {
              acl: 'private',
              contentType: file.mimetype,
              metadata: {
                originalName: file.originalname,
                uploadedAt: new Date().toISOString(),
              },
            },
          );
          return {
            url: s3UploadResult?.key,
            name: file?.originalname,
            size: file?.size,
            mimetype: file?.mimetype,
          };
        }),
      );
      const dbFiles = uploadResults.map((result) => ({
        name: result.name,
        mimeType: result.mimetype,
        size: result.size,
        url: result.url,
        createdAt: new Date(),
      }));

      if (uploadResults?.length > 0) {
        const updatedFolder = await this.folderService.saveFilestoFolder(
          folderId,
          dbFiles,
        );
        return {
          message: 'Files uploaded successfully',
          data: updatedFolder,
          dbFiles: dbFiles,
        };
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('download/:key')
  @ApiOperation({ summary: 'Download a file from S3' })
  @ApiParam({ name: 'key', description: 'File key/path in S3 bucket' })
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    try {
      // Check if file exists first
      const exists = await this.s3Service.fileExists(key);
      if (!exists) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      // Get file metadata for content type
      const metadata = await this.s3Service.getFileMetadata(key);

      // Download file as stream
      const stream = await this.s3Service.downloadFile(key);

      // Set response headers
      res.set({
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': metadata.contentLength?.toString() || '',
      });

      // Pipe the stream to response
      stream.pipe(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('presigned-upload-url')
  @ApiOperation({ summary: 'Generate pre-signed URL for file upload' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully',
  })
  async getPresignedUploadUrl(@Query() query: PresignedUrlDto) {
    try {
      const url = await this.s3Service.getPresignedUploadUrl(query.key, {
        expiresIn: query.expiresIn,
        contentType: query.contentType,
        acl: query.acl,
      });

      return {
        message: 'Pre-signed upload URL generated successfully',
        data: {
          url,
          key: query.key,
          expiresIn: query.expiresIn || 3600,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('presigned-download-url')
  @ApiOperation({ summary: 'Generate pre-signed URL for file download' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully',
  })
  async getPresignedDownloadUrl(@Query() query: PresignedUrlDto) {
    try {
      const url = await this.s3Service.getPresignedDownloadUrl(query.key, {
        expiresIn: query.expiresIn,
      });

      return {
        message: 'Pre-signed download URL generated successfully',
        data: {
          url,
          key: query.key,
          expiresIn: query.expiresIn || 3600,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiParam({ name: 'key', description: 'File key/path in S3 bucket' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('key') key: string) {
    try {
      await this.s3Service.deleteFile(key);

      return {
        message: 'File deleted successfully',
        data: { key },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if a file exists in S3' })
  @ApiParam({ name: 'key', description: 'File key/path in S3 bucket' })
  @ApiResponse({ status: 200, description: 'File existence status' })
  async fileExists(@Param('key') key: string) {
    try {
      const exists = await this.s3Service.fileExists(key);

      return {
        message: 'File existence checked',
        data: {
          key,
          exists,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('metadata/:key')
  @ApiOperation({ summary: 'Get file metadata from S3' })
  @ApiParam({ name: 'key', description: 'File key/path in S3 bucket' })
  @ApiResponse({
    status: 200,
    description: 'File metadata retrieved successfully',
  })
  async getFileMetadata(@Param('key') key: string) {
    try {
      const metadata = await this.s3Service.getFileMetadata(key);

      return {
        message: 'File metadata retrieved successfully',
        data: metadata,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'List files in S3 bucket' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async listFiles(@Query() query: ListFilesDto) {
    try {
      const result = await this.s3Service.listFiles(
        query.prefix,
        query.maxKeys,
      );

      return {
        message: 'Files listed successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('copy')
  @ApiOperation({ summary: 'Copy a file within S3' })
  @ApiResponse({ status: 200, description: 'File copied successfully' })
  async copyFile(@Body() copyDto: CopyFileDto) {
    try {
      await this.s3Service.copyFile(copyDto.sourceKey, copyDto.destinationKey);

      return {
        message: 'File copied successfully',
        data: {
          sourceKey: copyDto.sourceKey,
          destinationKey: copyDto.destinationKey,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('public-url/:key')
  @ApiOperation({ summary: 'Get public URL for a file' })
  @ApiParam({ name: 'key', description: 'File key/path in S3 bucket' })
  @ApiResponse({
    status: 200,
    description: 'Public URL generated successfully',
  })
  async getPublicUrl(@Param('key') key: string) {
    try {
      const url = this.s3Service.getPublicUrl(key);

      return {
        message: 'Public URL generated successfully',
        data: {
          key,
          url,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate-key')
  @ApiOperation({ summary: 'Generate a unique file key' })
  @ApiResponse({
    status: 200,
    description: 'Unique key generated successfully',
  })
  async generateUniqueKey(@Body() generateKeyDto: GenerateUniqueKeyDto) {
    try {
      const key = this.s3Service.generateUniqueKey(
        generateKeyDto.originalName,
        generateKeyDto.prefix,
      );

      return {
        message: 'Unique key generated successfully',
        data: {
          originalName: generateKeyDto.originalName,
          key,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
