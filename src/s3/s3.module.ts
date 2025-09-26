import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from '../common/services/s3.service';
import { S3Controller } from './s3.controller';
import { FoldersModule } from 'src/folder/folders.module';
import { LLMService } from 'src/common/services/llm.service';

@Global()
@Module({
  imports: [ConfigModule, FoldersModule],
  controllers: [S3Controller],
  providers: [S3Service, LLMService],
  exports: [S3Service, LLMService],
})
export class S3Module {}
