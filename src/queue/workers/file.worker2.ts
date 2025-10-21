import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { TextractService } from 'src/common/services/textract.service';
import { Folder, FolderDocument } from 'src/folder/schema/folder.schema';
import { FileStatus } from 'src/folder/schema/files.schema';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FileQueueService } from '../services/file.queue.service';
import { FolderRepository } from 'src/folder/repositories/folder.repository';
import { S3Service } from 'src/common/services/s3.service';

@Processor('file')
export class FileProcessor2 extends WorkerHost {
  constructor(
    private readonly textractService: TextractService,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly fileQueueService: FileQueueService,
    private readonly folderRepository: FolderRepository,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  async process(job: Job) {
    const { fileUrl, folderId, fileId, batchId } = job.data;
    // console.log('in work 2');
    try {
      const folder = await this.folderRepository.findById(folderId);
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
      const firstMetadata = mappedMetadata?.[0];
      const invoiceId = firstMetadata?.invoiceReceiptId?.trim();
      const invoiceDate = firstMetadata?.invoiceReceiptDate?.trim();
      if (!invoiceId || !invoiceDate) {
        await this.folderModel.updateOne(
          { _id: folderId, 'files._id': fileId },
          {
            $set: {
              'files.$.status': FileStatus.FAILED,
              'files.$.reason':
                'Missing invoiceReceiptId or invoiceReceiptDate during renaming.',
            },
            $push: { 'files.$.metadata': { $each: mappedMetadata } },
          },
        );

        db.ref(`folders/${folderId}/files/${fileId}`).update({
          status: FileStatus.FAILED,
          reason:
            'Missing invoiceReceiptId or invoiceReceiptDate during renaming.',
        });
      } else {
        await this.folderModel.updateOne(
          { _id: folderId, 'files._id': fileId },
          {
            $set: {
              'files.$.status': FileStatus.COMPLETED,
              'files.$.invoiceId': invoiceId,
              'files.$.invoiceDate': invoiceDate,
            },
            $push: { 'files.$.metadata': { $each: mappedMetadata } },
          },
        );
        let newName;
        if (folder?.format === 'Invoice-Date') {
          let newName = `${invoiceId}-${invoiceDate}`;
          const updatedFile = await this.s3Service.renameFileInFolder(
            fileId,
            newName,
          );

          db.ref(`folders/${folderId}/files/${fileId}`).update({
            status: FileStatus.COMPLETED,
            newName: updatedFile?.newName,
            url: updatedFile?.url,
          });
        } else if (folder?.format === 'Date-Invoice') {
          let newName = `${invoiceDate}-${invoiceId}`;
          const updatedFile = await this.s3Service.renameFileInFolder(
            fileId,
            newName,
          );

          // console.log('updatedFile', updatedFile);
          db.ref(`folders/${folderId}/files/${fileId}`).update({
            status: FileStatus.COMPLETED,
            newName: updatedFile?.newName,
            url: updatedFile?.url,
          });
        }
      }

      await this.fileQueueService.handleBatchCompletion(folderId, batchId);
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
      console.error(`Worker2 failed `, error.message);
    }
  }
}
