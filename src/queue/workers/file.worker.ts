// src/queue/workers/file.worker1.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TextractService } from 'src/common/services/textract.service';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SendgridService } from 'src/common/services/sendgrid';
import { UserService } from 'src/users/services/user.service';

@Processor('file')
export class FileProcessor extends WorkerHost {
  constructor(
    private readonly textractService: TextractService,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly sendgridService: SendgridService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async process(job: Job) {
    const { fileUrl, folderId, fileId, batchId } = job.data;
    // console.log('batch id in work 1', batchId);
    try {
      const jobId = await this.textractService.startInvoiceAnalysis(fileUrl);
      const results = await this.textractService.getInvoiceAnalysis(jobId);
      const mappedMetadata = results?.map((r) => ({
        address: r.ADDRESS ?? '',
        street: r.STREET ?? '',
        city: r.CITY ?? '',
        state: r.STATE ?? '',
        zipCode: r.ZIP_CODE ?? '',
        name: r.NAME ?? '',
        addressBlock: r.ADDRESS_BLOCK ?? '',
        customerNumber: r.CUSTOMER_NUMBER ?? '',
        invoiceReceiptDate: r.INVOICE_RECEIPT_DATE ?? '',
        invoiceReceiptId: r.INVOICE_RECEIPT_ID ?? '',
        receiverAddress: r.RECEIVER_ADDRESS ?? '',
        receiverName: r.RECEIVER_NAME ?? '',
      }));
      const db = this.firebaseService.getDb();
      db.ref(`folders/${folderId}/files/${fileId}`).set({
        metadata: mappedMetadata,
      });
      await this.folderModel.updateOne(
        { _id: folderId, 'files._id': fileId },
        {
          $set: {
            'files.$.status': FileStatus.COMPLETED,
          },
          $push: { 'files.$.metadata': { $each: mappedMetadata } },
        },
      );

      db.ref(`folders/${folderId}/files/${fileId}`).update({
        status: FileStatus.COMPLETED,
      });

      // Fetch folder
      const folder = await this.folderModel.findById(folderId);
      const user =
        folder?.userId &&
        (await this.userService.findById(folder.userId.toString()));
      const batchFiles = folder?.files.filter((f) => f.batchId === batchId);
      const totalFiles = batchFiles?.length;
      const completedFiles = batchFiles?.filter(
        (f) => f.status === FileStatus.COMPLETED,
      ).length;
      const failedFiles = batchFiles?.filter(
        (f) => f.status === FileStatus.FAILED,
      ).length;
      const processingFiles = batchFiles?.filter(
        (f) => f.status === FileStatus.PROCESSING,
      ).length;

      if (processingFiles === 0 && user) {
        await this.sendgridService.sendExtractionCompletedEmail(
          user.email,
          user.firstName,
          folder?.name,
          totalFiles,
          completedFiles,
          failedFiles,
        );
      }
      return results;
    } catch (error) {
      await this.folderModel.updateOne(
        { _id: folderId, 'files._id': fileId },
        {
          $set: {
            'files.$.status': FileStatus.FAILED,
            'files.$.error': error.message,
          },
        },
      );
      const db = this.firebaseService.getDb();
      db.ref(`folders/${folderId}/files/${fileId}`).update({
        status: FileStatus.FAILED,
      });
      console.error(`Worker1 failed file: ${fileId}`, error);
    }
  }
}
