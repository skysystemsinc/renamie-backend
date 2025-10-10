import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderController } from './controllers/folder.controller';
import { FolderService } from './services/folder.service';
import { FolderRepository } from './repositories/folder.repository';
import { UsersModule } from 'src/users/users.module';
import { FileQueueModule } from 'src/queue/file-queue.module';
import { Folder, FolderSchema } from './schema/folder.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
    UsersModule,
    FileQueueModule
  ],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
  exports: [FolderService, FolderRepository, FileQueueModule],
})
export class FoldersModule {}
