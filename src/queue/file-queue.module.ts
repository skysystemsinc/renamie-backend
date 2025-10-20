// src/queue/file-queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { FileQueueService } from './services/file.queue.service';
import { FileProcessor } from './workers/file.worker';
import { FileProcessor2 } from './workers/file.worker2';
import { TextractService } from 'src/common/services/textract.service';
import { Folder, FolderSchema } from 'src/folder/schema/folder.schema';
import { UsersModule } from 'src/users/users.module';
import { SendgridService } from 'src/common/services/sendgrid';
import { FolderRepository } from 'src/folder/repositories/folder.repository';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'file' }),
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
    UsersModule,
  ],
  providers: [FileQueueService, FileProcessor, FileProcessor2, TextractService, SendgridService, FolderRepository],
  exports: [FileQueueService],
})
export class FileQueueModule {}
