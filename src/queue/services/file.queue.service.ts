// src/queue/file-queue.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SendgridService } from 'src/common/services/sendgrid';
import { UserService } from 'src/users/services/user.service';

@Injectable()
export class FileQueueService implements OnModuleInit {
  constructor(
    @InjectQueue('file') private fileQueue: Queue,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly sendgridService: SendgridService,
    private readonly userService: UserService,
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

  async addFileToQueue(
    fileUrl: string,
    folderId: string,
    fileId: string,
    batchId: string,
  ) {
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

  async handleBatchCompletion(folderId: string, batchId: string) {
    const folder = await this.folderModel.findById(folderId);
    if (!folder) return;

    const batchFiles = folder.files.filter((f) => f.batchId === batchId);
    const totalFiles = batchFiles.length;
    const completedFiles = batchFiles.filter(
      (f) => f.status === FileStatus.COMPLETED,
    ).length;
    const failedFiles = batchFiles.filter(
      (f) => f.status === FileStatus.FAILED,
    ).length;
    const processingFiles = batchFiles.filter(
      (f) => f.status === FileStatus.PROCESSING,
    ).length;

    if (processingFiles === 0) {
      const updated = await this.folderModel.findOneAndUpdate(
        { _id: folderId, emailSentBatches: { $ne: batchId } },
        { $push: { emailSentBatches: batchId } },
        { new: true },
      );

      if (updated) {
        const user = await this.userService.findById(folder.userId.toString());
        if (user) {
          await this.sendgridService.sendExtractionCompletedEmail(
            user.email,
            user.firstName,
            folder.name,
            totalFiles,
            completedFiles,
            failedFiles,
          );
          // console.log(`Email sent for folder ${folderId}, batch ${batchId}`);
        }
      }
    }
  }
}
