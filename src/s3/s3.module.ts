import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from '../common/services/s3.service';
import { S3Controller } from './s3.controller';
import { FoldersModule } from 'src/folder/folders.module';
import { LLMService } from 'src/common/services/llm.service';
import { TextractService } from 'src/common/services/textract.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FileQueueModule } from 'src/queue/file-queue.module';

@Global()
@Module({
  imports: [ConfigModule, FoldersModule, FileQueueModule],
  controllers: [S3Controller],
  providers: [S3Service, TextractService, LLMService, FirebaseService],
  exports: [S3Service, TextractService, LLMService, FirebaseService],
})
export class S3Module {}
