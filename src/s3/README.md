# AWS S3 Integration for NestJS

This module provides a comprehensive AWS S3 integration for your NestJS application using AWS SDK v3.

## Features

- ✅ File upload with public/private ACL
- ✅ File download (stream or signed URL)
- ✅ File deletion
- ✅ Pre-signed URLs for uploads and downloads
- ✅ File existence checking
- ✅ File metadata retrieval
- ✅ File listing with prefix filtering
- ✅ File copying within S3
- ✅ Unique key generation
- ✅ Comprehensive error handling
- ✅ Security best practices

## Installation

The required dependencies are already installed:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install @nestjs/platform-express multer @types/multer
```

## Configuration

Add the following environment variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name-here
```

## Usage

### 1. Basic Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { S3Service } from '../common/services/s3.service';

@Injectable()
export class MyService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadUserAvatar(userId: string, file: Buffer) {
    const key = `avatars/${userId}/profile.jpg`;
    
    return await this.s3Service.uploadFile(key, file, {
      acl: 'public-read',
      contentType: 'image/jpeg',
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  async getPresignedUploadUrl(userId: string, fileName: string) {
    const key = `documents/${userId}/${fileName}`;
    
    return await this.s3Service.getPresignedUploadUrl(key, {
      expiresIn: 3600, // 1 hour
      contentType: 'application/pdf',
      acl: 'private',
    });
  }

  async downloadUserDocument(key: string) {
    return await this.s3Service.downloadFile(key);
  }

  async deleteUserFile(key: string) {
    await this.s3Service.deleteFile(key);
  }
}
```

### 2. Controller Usage Examples

The S3 module includes a complete controller with the following endpoints:

#### Upload File
```http
POST /s3/upload
Content-Type: multipart/form-data

Form Data:
- file: [binary file data]
- key: "uploads/myfile.jpg"
- acl: "public-read" (optional)
- contentType: "image/jpeg" (optional)
```

#### Generate Pre-signed Upload URL
```http
GET /s3/presigned-upload-url?key=uploads/myfile.jpg&expiresIn=3600&contentType=image/jpeg&acl=public-read
```

#### Generate Pre-signed Download URL
```http
GET /s3/presigned-download-url?key=uploads/myfile.jpg&expiresIn=3600
```

#### Download File
```http
GET /s3/download/uploads/myfile.jpg
```

#### Delete File
```http
DELETE /s3/uploads/myfile.jpg
```

#### Check File Existence
```http
GET /s3/exists/uploads/myfile.jpg
```

#### Get File Metadata
```http
GET /s3/metadata/uploads/myfile.jpg
```

#### List Files
```http
GET /s3/list?prefix=uploads/&maxKeys=50
```

#### Copy File
```http
POST /s3/copy
Content-Type: application/json

{
  "sourceKey": "uploads/original.jpg",
  "destinationKey": "thumbnails/original.jpg"
}
```

#### Generate Unique Key
```http
POST /s3/generate-key
Content-Type: application/json

{
  "originalName": "my-file.jpg",
  "prefix": "uploads/"
}
```

### 3. Advanced Usage Examples

#### File Upload with Validation
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from '../common/services/s3.service';

@Injectable()
export class FileUploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadImage(file: Express.Multer.File, userId: string) {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Generate unique key
    const key = this.s3Service.generateUniqueKey(
      file.originalname,
      `users/${userId}/images/`
    );

    // Upload to S3
    const result = await this.s3Service.uploadFile(key, file.buffer, {
      acl: 'public-read',
      contentType: file.mimetype,
      metadata: {
        userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
      cacheControl: 'max-age=31536000', // 1 year
    });

    return result;
  }
}
```

#### Batch File Operations
```typescript
@Injectable()
export class BatchFileService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadMultipleFiles(files: Express.Multer.File[], userId: string) {
    const uploadPromises = files.map(async (file, index) => {
      const key = this.s3Service.generateUniqueKey(
        file.originalname,
        `users/${userId}/documents/`
      );

      return this.s3Service.uploadFile(key, file.buffer, {
        acl: 'private',
        contentType: file.mimetype,
        metadata: {
          userId,
          originalName: file.originalname,
          index: index.toString(),
        },
      });
    });

    return Promise.all(uploadPromises);
  }

  async deleteUserFiles(userId: string) {
    // List all user files
    const { files } = await this.s3Service.listFiles(`users/${userId}/`);

    // Delete all files
    const deletePromises = files.map(file => 
      this.s3Service.deleteFile(file.key)
    );

    await Promise.all(deletePromises);
    return { deletedCount: files.length };
  }
}
```

#### File Processing Pipeline
```typescript
@Injectable()
export class FileProcessingService {
  constructor(private readonly s3Service: S3Service) {}

  async processUploadedFile(key: string) {
    try {
      // Check if file exists
      const exists = await this.s3Service.fileExists(key);
      if (!exists) {
        throw new Error('File not found');
      }

      // Get file metadata
      const metadata = await this.s3Service.getFileMetadata(key);
      console.log('File metadata:', metadata);

      // Create a backup copy
      const backupKey = key.replace('uploads/', 'backups/');
      await this.s3Service.copyFile(key, backupKey);

      // Generate public URL if file is public
      const publicUrl = this.s3Service.getPublicUrl(key);

      return {
        originalKey: key,
        backupKey,
        publicUrl,
        metadata,
      };
    } catch (error) {
      console.error('File processing failed:', error);
      throw error;
    }
  }
}
```

## Security Best Practices

### 1. Environment Variables
- Never hardcode AWS credentials in your code
- Use environment variables for all sensitive configuration
- Consider using AWS IAM roles for production deployments

### 2. Access Control
- Use private ACL by default
- Only use public-read ACL when necessary
- Implement proper authentication and authorization

### 3. File Validation
```typescript
// Validate file types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}

// Validate file size
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new BadRequestException('File too large');
}

// Sanitize file names
const sanitizedKey = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
```

### 4. Pre-signed URLs
- Use short expiration times for pre-signed URLs
- Implement rate limiting for URL generation
- Validate user permissions before generating URLs

### 5. Error Handling
```typescript
try {
  await this.s3Service.uploadFile(key, file);
} catch (error) {
  if (error.name === 'NoSuchBucket') {
    throw new BadRequestException('Storage bucket not configured');
  } else if (error.name === 'AccessDenied') {
    throw new ForbiddenException('Access denied to storage');
  } else {
    throw new InternalServerErrorException('Upload failed');
  }
}
```

## Error Handling

The S3 service includes comprehensive error handling for common AWS S3 errors:

- `NoSuchKey`: File not found
- `AccessDenied`: Insufficient permissions
- `NoSuchBucket`: Bucket doesn't exist
- `InvalidAccessKeyId`: Invalid AWS credentials
- `SignatureDoesNotMatch`: Invalid AWS signature

## Testing

### Unit Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../common/services/s3.service';

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                AWS_REGION: 'us-east-1',
                AWS_S3_BUCKET_NAME: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests for specific methods
});
```

## Troubleshooting

### Common Issues

1. **Invalid AWS Credentials**
   - Check your `.env` file has correct AWS credentials
   - Verify your AWS user has S3 permissions

2. **Bucket Not Found**
   - Ensure the bucket name is correct
   - Check if the bucket exists in the specified region

3. **Access Denied**
   - Verify your AWS user has the necessary S3 permissions
   - Check bucket policies and ACLs

4. **File Upload Fails**
   - Check file size limits
   - Verify network connectivity
   - Check AWS service status

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In your main.ts or app module
import { Logger } from '@nestjs/common';
Logger.debug('S3 Service initialized', 'S3Service');
```

## Production Considerations

1. **Use IAM Roles**: Instead of access keys, use IAM roles for EC2/ECS deployments
2. **Enable CloudTrail**: Monitor S3 API calls for security auditing
3. **Set up S3 Lifecycle Policies**: Automatically manage file storage costs
4. **Implement CORS**: Configure CORS for web applications
5. **Use S3 Transfer Acceleration**: For global file uploads
6. **Monitor Costs**: Set up billing alerts for S3 usage

## License

This S3 integration module is part of your NestJS application and follows the same license terms.
