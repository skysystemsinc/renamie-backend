// src/queue/file-queue.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';


@Injectable()
export class FileQueueService implements OnModuleInit {
  constructor(
    @InjectQueue('file') private fileQueue: Queue,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
  ) {}

  async onModuleInit() {
    console.log('start')
    await this.getFiles();
  }

  async getFiles() {
    const pendingFiles = await this.folderModel.aggregate([
      { $unwind: '$files' },
      { $match: { 'files.status': FileStatus.PENDING } },
      {
        $project: {
          folderId: '$_id',
          fileId: '$files._id',
          name: '$files.name',
          status: '$files.status',
          url: '$files.url',
        },
      },
    ]);

    console.log('All pending files:', pendingFiles);
    for (const file of pendingFiles) {
      // console.log('file', file);
      await this.fileQueue.add('processFile', {
        fileUrl: file.url,
        folderId: file.folderId.toString(),
        fileId: file.fileId.toString(),
      });

      await this.folderModel.updateOne(
        { _id: file.folderId, 'files._id': file.fileId },
        { $set: { 'files.$.status': FileStatus.PROCESSING } },
      );
    }
  }
}
