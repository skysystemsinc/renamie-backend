// src/queue/workers/file.worker1.ts
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
export class FileProcessor extends WorkerHost {
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

  private async handleFailedFile(
    folderId: string,
    fileId: string,
    fileUrl: string,
    mappedMetadata: any[],
  ) {
    const db = this.firebaseService.getDb();
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
      url: fileUrl,
      status: FileStatus.FAILED,
      metadata: mappedMetadata,
      reason: 'Missing invoiceReceiptId or invoiceReceiptDate during renaming.',
    });
  }

  private async handleSuccessRename(
    folderId: string,
    fileId: string,
    newName: string,
    invoiceId: string,
    invoiceDate: string,
    mappedMetadata: any[],
  ) {
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
    const db = this.firebaseService.getDb();
    const updatedFile = await this.s3Service.renameFileInFolder(
      fileId,
      newName,
    );
    db.ref(`folders/${folderId}/files/${fileId}`).update({
      status: FileStatus.COMPLETED,
      newName: updatedFile?.newName,
      url: updatedFile?.url,
    });
  }

  async process(job: Job) {
    const {
      fileUrl,
      folderId,
      fileId,
      batchId,
      userEmail,
      emailNotification,
      userName,
      collaborator,
    } = job.data;
    try {
      console.log('emial in job 1', userEmail);
      const folder = await this.folderRepository.findById(folderId);
      console.log('fo;de', folder);
      const bookData = folder?.book;
      console.log('book data', bookData);
      const jobId = await this.textractService.startInvoiceAnalysis(fileUrl);
      const results = await this.textractService.getInvoiceAnalysis(jobId);
      const mappedMetadata = Array.isArray(results)
        ? results.map((r) => ({
            address: r.ADDRESS ?? '',
            street: r.STREET ?? '',
            city: r.CITY ?? '',
            state: r.STATE ?? '',
            zipCode: r.ZIP_CODE ?? '',
            addressBlock: r.ADDRESS_BLOCK ?? '',
            name: r.NAME ?? '',
            customerNumber: r.CUSTOMER_NUMBER ?? '',
            invoiceReceiptDate: r.INVOICE_RECEIPT_DATE ?? '',
            invoiceReceiptId: r.INVOICE_RECEIPT_ID ?? '',
            orderDate: r.ORDER_DATE ?? '',
            paymentTerms: r.PAYMENT_TERMS ?? '',
            receiverName: r.RECEIVER_NAME ?? '',
            subtotal: r.SUBTOTAL ?? '',
            total: r.TOTAL ?? '',
            vendorAddress: r.VENDOR_ADDRESS ?? '',
            vendorName: r.VENDOR_NAME ?? '',
            vendorPhone: r.VENDOR_PHONE ?? '',
            vendorUrl: r.VENDOR_URL ?? '',
            other: r.OTHER ?? '',
          }))
        : [];
      const db = this.firebaseService.getDb();
      db.ref(`folders/${folderId}/files/${fileId}`).set({
        metadata: mappedMetadata,
      });
      const firstMetadata = mappedMetadata?.[0];
      const invoiceId = firstMetadata?.invoiceReceiptId?.trim();
      const invoiceDate = firstMetadata?.invoiceReceiptDate?.trim();
      //
      // const discountAmount = firstMetadata?.total;
      if (firstMetadata?.total != null && bookData?.vendorNetTerm != null) {
        const total = Number(firstMetadata.total);
        const discountRate = 1 / Number(bookData.vendorNetTerm);
        // const discountAmount = total * discountRate;
      const discountAmount = parseFloat((total * discountRate).toFixed(2));

        console.log('discountAmount', discountAmount);
        await this.folderModel.updateOne(
          { _id: folderId, 'files._id': fileId },
          {
            $set: {
              'files.$.discountAmount': discountAmount,
            },
          },
        );
      }

      //
      if (
        folder?.format === 'Invoice-Date' ||
        folder?.format === 'Date-Invoice'
      ) {
        if (!invoiceId || !invoiceDate) {
          await this.handleFailedFile(
            folderId,
            fileId,
            fileUrl,
            mappedMetadata ?? [],
          );
        } else {
          const newName =
            folder.format === 'Invoice-Date'
              ? `${invoiceId}-${invoiceDate}`
              : `${invoiceDate}-${invoiceId}`;

          await this.handleSuccessRename(
            folderId,
            fileId,
            newName,
            invoiceId,
            invoiceDate,
            mappedMetadata ?? [],
          );
        }
      }

      if (folder?.format === 'Invoice') {
        if (!invoiceId) {
          await this.handleFailedFile(
            folderId,
            fileId,
            fileUrl,
            mappedMetadata ?? [],
          );
        } else {
          let newName = `${invoiceId}`;
          await this.handleSuccessRename(
            folderId,
            fileId,
            newName,
            invoiceId,
            invoiceDate ?? '',
            mappedMetadata ?? [],
          );
        }
      }

      if (folder?.format === 'Date') {
        if (!invoiceDate) {
          await this.handleFailedFile(
            folderId,
            fileId,
            fileUrl,
            mappedMetadata ?? [],
          );
        } else {
          let newName = `${invoiceDate}`;
          await this.handleSuccessRename(
            folderId,
            fileId,
            newName,
            invoiceId ?? '',
            invoiceDate,
            mappedMetadata ?? [],
          );
        }
      }

      await this.fileQueueService.handleBatchCompletion(
        folderId,
        batchId,
        userEmail,
        emailNotification,
        userName,
        collaborator,
      );
      return results;
    } catch (error) {
      console.log('file work 1 ', error);
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
