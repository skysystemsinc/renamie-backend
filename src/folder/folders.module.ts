import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderController } from './controllers/folder.controller';
import { FolderService } from './services/folder.service';
import { FolderRepository } from './repositories/folder.repository';
import { UsersModule } from 'src/users/users.module';
import { FileQueueModule } from 'src/queue/file-queue.module';
import { Folder, FolderSchema } from './schema/folder.schema';
import { S3Service } from 'src/common/services/s3.service';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { JobService } from './services/job.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
    UsersModule,
    FileQueueModule,
    SubscriptionsModule,
  ],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository, S3Service, JobService],
  exports: [FolderService, FolderRepository, S3Service],
})
export class FoldersModule {}
