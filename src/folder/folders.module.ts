import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Folder, FolderSchema } from 'src/payments/schemas/folder.schema';
import { FolderController } from './controllers/folder.controller';
import { FolderService } from './services/folder.service';
import { FolderRepository } from './repositories/folder.repository';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
    UsersModule,
  ],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
  exports: [FolderService, FolderRepository],
})
export class FoldersModule {}
