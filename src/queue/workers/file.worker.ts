// src/queue/workers/file.worker1.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TextractService } from 'src/common/services/textract.service';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';
import { FirebaseService } from 'src/firebase/firebase.service';

@Processor('file')
export class FileProcessor extends WorkerHost {
  constructor(
    private readonly textractService: TextractService,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    private readonly firebaseService: FirebaseService,
  ) {
    super();
  }

  async process(job: Job) {
    const { fileUrl, folderId, fileId } = job.data;

    try {
      const jobId = await this.textractService.startInvoiceAnalysis(fileUrl);
      const results = await this.textractService.getInvoiceAnalysis(jobId);
      const mappedMetadata = results?.map((r) => ({
        address: r.ADDRESS,
        street: r.STREET,
        city: r.CITY,
        state: r.STATE,
        zipCode: r.ZIP_CODE,
        name: r.NAME,
        addressBlock: r.ADDRESS_BLOCK,
        customerNumber: r.CUSTOMER_NUMBER,
        invoiceReceiptDate: r.INVOICE_RECEIPT_DATE,
        invoiceReceiptId: r.INVOICE_RECEIPT_ID,
        receiverAddress: r.RECEIVER_ADDRESS,
        receiverName: r.RECEIVER_NAME,
      }));

      const db = this.firebaseService.getDb();

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
      console.error(`Worker1 failed file: ${fileId}`, error.message);
    }
  }
}
