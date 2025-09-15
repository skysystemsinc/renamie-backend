import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { S3Service } from '../../common/services/s3.service';

/**
 * Example controller showing how to integrate S3 service
 * in a real-world scenario with user-specific file management
 */
@ApiTags('User Files')
@ApiBearerAuth()
@Controller('users/:userId/files')
export class UserFilesController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user avatar' })
  async uploadAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for avatar');
    }

    // Validate file size (2MB limit for avatars)
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Avatar file size must be less than 2MB');
    }

    const key = `users/${userId}/avatar.jpg`;
    
    try {
      const result = await this.s3Service.uploadFile(key, file.buffer, {
        acl: 'public-read',
        contentType: file.mimetype,
        metadata: {
          userId,
          type: 'avatar',
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        message: 'Avatar uploaded successfully',
        data: {
          ...result,
          publicUrl: result.location,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user document' })
  async uploadDocument(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF, JPEG, and PNG files are allowed');
    }

    // Validate file size (10MB limit for documents)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Document file size must be less than 10MB');
    }

    const key = this.s3Service.generateUniqueKey(
      file.originalname,
      `users/${userId}/documents/`
    );
    
    try {
      const result = await this.s3Service.uploadFile(key, file.buffer, {
        acl: 'private',
        contentType: file.mimetype,
        metadata: {
          userId,
          type: 'document',
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        message: 'Document uploaded successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  @Get('presigned-upload-url')
  @ApiOperation({ summary: 'Get pre-signed URL for document upload' })
  async getPresignedUploadUrl(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const fileName = req.query.fileName || 'document';
    const contentType = req.query.contentType || 'application/pdf';
    
    const key = this.s3Service.generateUniqueKey(
      fileName,
      `users/${userId}/documents/`
    );
    
    try {
      const url = await this.s3Service.getPresignedUploadUrl(key, {
        expiresIn: 3600, // 1 hour
        contentType,
        acl: 'private',
      });

      return {
        message: 'Pre-signed upload URL generated',
        data: {
          uploadUrl: url,
          key,
          expiresIn: 3600,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate upload URL: ${error.message}`);
    }
  }

  @Get('avatar')
  @ApiOperation({ summary: 'Get user avatar URL' })
  async getAvatar(@Param('userId') userId: string) {
    const key = `users/${userId}/avatar.jpg`;
    
    try {
      const exists = await this.s3Service.fileExists(key);
      if (!exists) {
        throw new NotFoundException('Avatar not found');
      }

      const publicUrl = this.s3Service.getPublicUrl(key);
      
      return {
        message: 'Avatar URL retrieved',
        data: {
          key,
          url: publicUrl,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get avatar: ${error.message}`);
    }
  }

  @Get('documents/:key/download-url')
  @ApiOperation({ summary: 'Get pre-signed download URL for document' })
  async getDocumentDownloadUrl(
    @Param('userId') userId: string,
    @Param('key') key: string,
  ) {
    const fullKey = `users/${userId}/documents/${key}`;
    
    try {
      const exists = await this.s3Service.fileExists(fullKey);
      if (!exists) {
        throw new NotFoundException('Document not found');
      }

      const url = await this.s3Service.getPresignedDownloadUrl(fullKey, {
        expiresIn: 3600, // 1 hour
      });

      return {
        message: 'Download URL generated',
        data: {
          downloadUrl: url,
          key: fullKey,
          expiresIn: 3600,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to generate download URL: ${error.message}`);
    }
  }

  @Get('documents')
  @ApiOperation({ summary: 'List user documents' })
  async listDocuments(@Param('userId') userId: string) {
    const prefix = `users/${userId}/documents/`;
    
    try {
      const result = await this.s3Service.listFiles(prefix);

      return {
        message: 'Documents listed successfully',
        data: {
          documents: result.files,
          total: result.files.length,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to list documents: ${error.message}`);
    }
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Delete user avatar' })
  async deleteAvatar(@Param('userId') userId: string) {
    const key = `users/${userId}/avatar.jpg`;
    
    try {
      const exists = await this.s3Service.fileExists(key);
      if (!exists) {
        throw new NotFoundException('Avatar not found');
      }

      await this.s3Service.deleteFile(key);

      return {
        message: 'Avatar deleted successfully',
        data: { key },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete avatar: ${error.message}`);
    }
  }

  @Delete('documents/:key')
  @ApiOperation({ summary: 'Delete user document' })
  async deleteDocument(
    @Param('userId') userId: string,
    @Param('key') key: string,
  ) {
    const fullKey = `users/${userId}/documents/${key}`;
    
    try {
      const exists = await this.s3Service.fileExists(fullKey);
      if (!exists) {
        throw new NotFoundException('Document not found');
      }

      await this.s3Service.deleteFile(fullKey);

      return {
        message: 'Document deleted successfully',
        data: { key: fullKey },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete document: ${error.message}`);
    }
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all user files' })
  async deleteAllUserFiles(@Param('userId') userId: string) {
    const prefix = `users/${userId}/`;
    
    try {
      // List all user files
      const { files } = await this.s3Service.listFiles(prefix);

      if (files.length === 0) {
        return {
          message: 'No files found for user',
          data: { deletedCount: 0 },
        };
      }

      // Delete all files
      const deletePromises = files.map(file => 
        this.s3Service.deleteFile(file.key || '')
      );

      await Promise.all(deletePromises);

      return {
        message: 'All user files deleted successfully',
        data: { deletedCount: files.length },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete user files: ${error.message}`);
    }
  }
}
