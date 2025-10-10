// src/queue/file-queue.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class FileQueueService implements OnModuleInit {
  constructor(
    @InjectQueue('file') private fileQueue: Queue,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async onModuleInit() {
    console.log('start');
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
          batchId: '$files.batchId',
        },
      },
    ]);
    // console.log('pendingFiles',pendingFiles);
    const db = this.firebaseService.getDb();

    for (const file of pendingFiles) {
      // console.log('file', file);
      await this.fileQueue.add('processFile', {
        fileUrl: file.url,
        folderId: file.folderId.toString(),
        fileId: file.fileId.toString(),
        batchId: file.batchId,
      });

      await this.folderModel.updateOne(
        { _id: file.folderId, 'files._id': file.fileId },
        { $set: { 'files.$.status': FileStatus.PROCESSING } },
      );

      db.ref(`folders/${file.folderId}/files/${file.fileId}`).update({
        status: FileStatus.PROCESSING,
      });
    }
  }
  
  async addFileToQueue(fileUrl: string, folderId: string, fileId: string, batchId: string) {
    const db = this.firebaseService.getDb();
    try {
      await this.fileQueue.add('processFile', {
        fileUrl,
        folderId,
        fileId,
        batchId,
      });
  
      await this.folderModel.updateOne(
        { _id: folderId, 'files._id': fileId },
        { $set: { 'files.$.status': FileStatus.PROCESSING } },
      );
  
      db.ref(`folders/${folderId}/files/${fileId}`).update({
        status: FileStatus.PROCESSING,
      });
    } catch (error) {
      console.log('error', error);
      db.ref(`folders/${folderId}/files/${fileId}`).update({
        status: FileStatus.FAILED,
      });
      throw new Error(`Failed to add file to queue: ${error.message}`);
    }
  }
}
