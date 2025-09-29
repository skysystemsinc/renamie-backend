import { Injectable, Logger } from '@nestjs/common';
import {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  Block,
  GetDocumentAnalysisCommandOutput,
} from '@aws-sdk/client-textract';

@Injectable()
export class TextractService {
  private readonly logger = new Logger(TextractService.name);
  private textractClient = new TextractClient({
    region: process.env.AWS_REGION,
  });

  async startAnalysis(key: string): Promise<string> {
    const command = new StartDocumentAnalysisCommand({
      DocumentLocation: { S3Object: { Bucket: process.env.bucket, Name: key } },
      FeatureTypes: ['FORMS'],
    });

    const response = await this.textractClient.send(command);
    if (!response.JobId) {
      throw new Error('Failed to start Textract job');
    }

    this.logger.log(`Started Textract job: ${response.JobId}`);
    return response.JobId;
  }

  async handleResult(jobId: string, key: string): Promise<string> {
    let jobStatus = 'IN_PROGRESS';
    let response: GetDocumentAnalysisCommandOutput | undefined;

    while (jobStatus === 'IN_PROGRESS') {
      const command = new GetDocumentAnalysisCommand({ JobId: jobId });
      response = await this.textractClient.send(command);

      jobStatus = response.JobStatus ?? 'FAILED';
      this.logger.log(`Textract job ${jobId} status: ${jobStatus}`);

      if (jobStatus === 'IN_PROGRESS') {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (jobStatus !== 'SUCCEEDED' || !response?.Blocks) {
      throw new Error(`Textract job ${jobId} failed with status ${jobStatus}`);
    }

    const { invoice, date } = this.extractInvoiceData(response.Blocks);

    const extension = key.split('.').pop();
    const newKey = `uploads/${invoice}_${date}.${extension}`;

    this.logger.log(`Renamed file: ${key} → ${newKey}`);
    return newKey;
  }

  private extractInvoiceData(blocks: Block[] = []): {
    invoice: string;
    date: string;
  } {
    let invoice = 'unknown_invoice';
    let date = 'unknown_date';

    for (const block of blocks) {
      if (
        block.BlockType === 'KEY_VALUE_SET' &&
        block.EntityTypes?.includes('KEY')
      ) {
        const keyText = block.Text?.toLowerCase() || '';
        const valueBlockId = block.Relationships?.find(
          (r) => r.Type === 'VALUE',
        )?.Ids?.[0];
        const valueBlock = blocks.find((b) => b.Id === valueBlockId);

        const valueText = valueBlock?.Text?.trim();

        if (keyText.includes('invoice') && valueText) {
          invoice = valueText;
        }

        if (keyText.includes('date') && valueText) {
          date = valueText;
        }
      }
    }

    if (invoice === 'unknown_invoice' || date === 'unknown_date') {
      for (const block of blocks) {
        if (block.BlockType === 'LINE' && block.Text) {
          const text = block.Text.toLowerCase();

          if (invoice === 'unknown_invoice' && text.includes('invoice')) {
            invoice = block.Text.split(':').pop()?.trim() || invoice;
          }

          if (date === 'unknown_date' && text.includes('date')) {
            date = block.Text.split(':').pop()?.trim() || date;
          }
        }
      }
    }

    return { invoice, date };
  }
}
