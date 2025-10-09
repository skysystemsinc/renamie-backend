import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { TextractService } from 'src/common/services/textract.service';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';

@Processor('file')
export class FileProcessor2 extends WorkerHost {
  constructor(
    private readonly textractService: TextractService,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
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
      await this.folderModel.updateOne(
        { _id: folderId, 'files._id': fileId },
        {
          $set: {
            'files.$.status': FileStatus.COMPLETED,
          },
          $push: { 'files.$.metadata': { $each: mappedMetadata } },
        },
      );
      console.log('workjers 2', results);
      console.log(`Worker2 processed file: ${fileId}`);
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
      console.error(`Worker2 failed file: ${fileId}`, error.message);
    }
  }
}
