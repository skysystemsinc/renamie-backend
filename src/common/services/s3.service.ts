import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import {
  getSignedUrl,
  S3RequestPresigner,
} from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import AdmZip from 'adm-zip';
import { FileStatus } from 'src/folder/schema/files.schema';
import { FolderService } from 'src/folder/services/folder.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FolderRepository } from 'src/folder/repositories/folder.repository';
import { FileQueueService } from 'src/queue/services/file.queue.service';
import { UserService } from 'src/users/services/user.service';

export interface S3UploadOptions {
  acl?: 'public-read' | 'private';
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface S3UploadResult {
  key: string;
  location?: string;
  etag: string;
  versionId?: string;
}

export interface S3DownloadOptions {
  expiresIn?: number; // in seconds
  mode?: string;
}

export interface S3PresignedUrlOptions {
  expiresIn?: number; // in seconds
  contentType?: string;
  acl?: 'public-read' | 'private';
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private configService: ConfigService,
    private readonly folderService: FolderService,
    private readonly firebaseService: FirebaseService,
    private readonly folderRepository: FolderRepository,
    private readonly fileQueueService: FileQueueService,
    private readonly userService: UserService,
  ) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const region = this.configService.get<string>('AWS_REGION');
    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';

    console.log(`accessKeyId: ${accessKeyId}`);
    console.log(`secretAccessKey: ${secretAccessKey}`);
    console.log(`region: ${region}`);
    console.log(`bucketName: ${this.bucketName}`);

    if (!accessKeyId || !secretAccessKey || !region || !this.bucketName) {
      throw new Error(
        'AWS S3 configuration is incomplete. Please check your environment variables.',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('S3Service initialized successfully');
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    file: Buffer | Uint8Array | string | Readable,
    options: S3UploadOptions = {},
  ): Promise<S3UploadResult> {
    try {
      const { acl = 'private', contentType, metadata, cacheControl } = options;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ACL: acl,
        ContentType: contentType,
        Metadata: metadata,
        CacheControl: cacheControl,
      });

      const result = await this.s3Client.send(command);

      const location =
        acl === 'public-read'
          ? `https://${this.bucketName}.s3.amazonaws.com/${key}`
          : undefined;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        location,
        etag: result.ETag || '',
        versionId: result.VersionId,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Download a file from S3 as a stream
   */
  async downloadFile(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const result = await this.s3Client.send(command);

      if (!result.Body) {
        throw new Error('File not found or empty');
      }

      this.logger.log(`File downloaded successfully: ${key}`);

      // Convert the Body to a readable stream
      return result.Body as Readable;
    } catch (error) {
      this.logger.error(`Failed to download file ${key}:`, error);
      if (error.name === 'NoSuchKey') {
        throw new Error(`File not found: ${key}`);
      }
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      this.logger.error(`Error checking file existence ${key}:`, error);
      throw new Error(`Failed to check file existence: ${error.message}`);
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const result = await this.s3Client.send(command);

      return {
        key,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get file metadata ${key}:`, error);
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        throw new Error(`File not found: ${key}`);
      }
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List files in a directory/prefix
   */
  async listFiles(prefix?: string, maxKeys?: number) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const result = await this.s3Client.send(command);

      return {
        files:
          result.Contents?.map((obj) => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag,
          })) || [],
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken,
      };
    } catch (error) {
      this.logger.error(`Failed to list files with prefix ${prefix}:`, error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Generate a pre-signed URL for file upload
   */
  async getPresignedUploadUrl(
    key: string,
    options: S3PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      const {
        expiresIn = 3600, // 1 hour default
        contentType,
        acl = 'private',
      } = options;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ACL: acl,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Pre-signed upload URL generated for: ${key}`);

      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate pre-signed upload URL for ${key}:`,
        error,
      );
      throw new Error(
        `Failed to generate pre-signed upload URL: ${error.message}`,
      );
    }
  }

  /**
   * Generate a pre-signed URL for file download
   */
  async getPresignedDownloadUrl(
    key: string,
    options: S3DownloadOptions = {},
  ): Promise<string> {
    try {
      console.log('key', key);
      const { expiresIn = 3600, mode } = options; // 1 hour default
      const contentDisposition =
        mode === 'view'
          ? `inline; filename="${key.split('/').pop()}"`
          : `attachment; filename="${key.split('/').pop()}"`;

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: contentDisposition,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Pre-signed download URL generated for: ${key}`);

      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate pre-signed download URL for ${key}:`,
        error,
      );
      if (error.name === 'NoSuchKey') {
        throw new Error(`File not found: ${key}`);
      }
      throw new Error(
        `Failed to generate pre-signed download URL: ${error.message}`,
      );
    }
  }

  /**
   * Copy a file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        Key: destinationKey,
        CopySource: `${this.bucketName}/${sourceKey}`,
      } as any);
      await this.s3Client.send(command);

      this.logger.log(`File copied from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to copy file from ${sourceKey} to ${destinationKey}:`,
        error,
      );
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Get the public URL for a file (only works for public files)
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  /**
   * Generate a unique file key with timestamp
   */
  generateUniqueKey(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const key = `${prefix || ''}${nameWithoutExt}_${timestamp}_${random}.${extension}`;
    return key.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  //

  generatekey(originalName: string, prefix?: string): string {
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const key = `${prefix || ''}${nameWithoutExt}_${random}.${extension}`;
    return key.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  // rename file
  async renameFileInFolder(fileId: string, newName: string) {
    const fileRecord = await this.folderRepository.findFileById(fileId);
    if (!fileRecord) throw new NotFoundException('File not found');
    const oldKey = fileRecord.url;
    const fileExtension = oldKey.substring(oldKey.lastIndexOf('.'));
    const newKey = this.generatekey(`${newName}${fileExtension.toLowerCase()}`);
    await this.copyFile(oldKey, newKey);
    await this.deleteFile(oldKey);
    await this.folderRepository.updateFileData(fileId, {
      newName: `${newName}${fileExtension}`,
      url: newKey,
      rename_at: new Date(),
    });
    const updatedFile = await this.folderRepository.findFileById(fileId);
    return updatedFile;
  }

  // file upload
  async uploadFiles(
    userId: string,
    folderId: string,
    files: Array<Express.Multer.File>,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      const batchId = `batch_${Math.floor(Math.random() * 1000)}`;
      const allFiles = [];

      for (const file of files) {
        if (
          file.mimetype === 'application/zip' ||
          file.mimetype === 'application/x-zip-compressed'
        ) {
          const zip = new AdmZip(file.buffer);
          const entries = zip.getEntries();

          for (const entry of entries) {
            if (entry.isDirectory) continue;

            if (!entry.entryName.toLowerCase().endsWith('.pdf')) {
              throw new BadRequestException(
                'The ZIP file must contain only PDF documents.',
              );
            }

            allFiles.push({
              name: entry.entryName,
              mimetype: 'application/pdf',
              size: entry.header.size,
              buffer: entry.getData(),
            });
          }
        } else if (file.mimetype === 'application/pdf') {
          allFiles.push({
            name: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer,
          });
        } else {
          throw new BadRequestException('Only PDF or ZIP files are allowed');
        }
      }

      const uploadResults = await Promise.all(
        allFiles.map(async (file) => {
          const key = this.generateUniqueKey(file.name, 'uploads/');
          const s3UploadResult = await this.uploadFile(key, file.buffer, {
            acl: 'private',
            contentType: file.mimetype,
            metadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
            },
          });

          return {
            url: s3UploadResult?.key,
            name: file.name,
            size: file.size,
            mimetype: file.mimetype,
          };
        }),
      );

      const dbFiles = uploadResults.map((result) => ({
        name: result.name,
        mimeType: result.mimetype,
        size: result.size,
        url: result.url,
        createdAt: new Date(),
        status: FileStatus.PENDING,
        batchId,
      }));

      if (uploadResults?.length > 0) {
        const updatedFiles = await this.folderService.saveFilestoFolder(
          folderId,
          dbFiles,
        );
        const db = this.firebaseService.getDb();

        for (const file of updatedFiles) {
          db.ref(`folders/${folderId}/files/${file._id}`).set({
            name: file.name,
            status: file.status,
          });

          await this.fileQueueService.addFileToQueue(
            file.url,
            folderId,
            (file as any)._id.toString(),
            batchId,
          );
        }

        return {
          message: 'Files uploaded successfully',
          data: updatedFiles,
        };
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
