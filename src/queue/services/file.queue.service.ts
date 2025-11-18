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
    userEmail: string,
    userName: string,
    emailNotification?: boolean,
    collaborator?: boolean,
  ) {
    const db = this.firebaseService.getDb();
    try {
      const queueRes = await this.fileQueue.add('processFile', {
        fileUrl,
        folderId,
        fileId,
        batchId,
        userEmail,
        emailNotification,
        userName,
        collaborator,
      });
      await this.folderModel.updateOne(
        { _id: folderId, 'files._id': fileId },
        { $set: { 'files.$.status': FileStatus.PROCESSING } },
      );

      db.ref(`folders/${folderId}/files/${fileId}`).update({
        url: fileUrl,
        status: FileStatus.PROCESSING,
      });
    } catch (error) {
      console.log('que error', error);
      db.ref(`folders/${folderId}/files/${fileId}`).update({
        url: fileUrl,
        status: FileStatus.FAILED,
      });

      throw new Error(`Failed to add file to queue: ${error}`);
    }
  }

  async handleBatchCompletion(
    folderId: string,
    batchId: string,
    userEmail: string,
    emailNotification: boolean,
    userName: string,
    collaborator: boolean,
  ) {
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
      if (updated && updated.parentUser) {
        const owner = await this.userService.findById(
          updated.parentUser.toString(),
        );
        try {
          if (collaborator && !owner?.isCollaborator) {
            // send email to owner
            await this.sendgridService.sendExtractionCompletedEmailToOwner(
              owner?.email, //owner email
              owner?.firstName,
              userName,
              folder.name,
              totalFiles,
              completedFiles,
              failedFiles,
              owner?.emailNotification,
            );

            // send email to collaboratoer
            await this.sendgridService.sendExtractionCompletedEmail(
              userEmail, //collaborator email
              userName,
              folder.name,
              totalFiles,
              completedFiles,
              failedFiles,
              emailNotification,
            );
          } else {
            await this.sendgridService.sendExtractionCompletedEmail(
              userEmail,
              userName,
              folder.name,
              totalFiles,
              completedFiles,
              failedFiles,
              emailNotification,
            );
          }
        } catch (emailError) {
          console.error(
            `Failed to send batch completion email for folder ${folderId}, batch ${batchId}:`,
            emailError.message,
          );
        }
      }
    }
  }
}
