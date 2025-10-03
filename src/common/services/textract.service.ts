import { Injectable, Logger } from '@nestjs/common';
import {
  TextractClient,
  StartExpenseAnalysisCommand,
  GetExpenseAnalysisCommand,
  StartExpenseAnalysisCommandOutput,
  GetExpenseAnalysisCommandOutput,
} from '@aws-sdk/client-textract';

@Injectable()
export class TextractService {
  private readonly client: TextractClient;

  constructor() {
    this.client = new TextractClient({
      region: process.env.AWS_REGION as string,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async startInvoiceAnalysis(key: string): Promise<string> {
    try {
      const command = new StartExpenseAnalysisCommand({
        DocumentLocation: {
          S3Object: { Bucket: process.env.AWS_S3_BUCKET_NAME, Name: key },
        },
      });

      const response: StartExpenseAnalysisCommandOutput =
        await this.client.send(command);

      if (!response.JobId) {
        throw new Error('Textract did not return a JobId');
      }

      return response.JobId;
    } catch (err) {
      throw err;
    }
  }

  private parseInvoiceData(expenseDoc: any[]) {
    // console.log('expenseDoc', expenseDoc[0]);
    // console.log('Blocks',LineItemGroups)
    // return expenseDoc[0].SummaryFields;
    return expenseDoc.map((doc) => {
      const summary: Record<string, string> = {};
      doc.SummaryFields?.forEach((field: any) => {
        const type = field.Type?.Text;
        const value = field.ValueDetection?.Text;

        if (type && value) {
          summary[type] = value;
        }
      });

      return summary;
    });
  }

  async getInvoiceAnalysis(jobId: string) {
    let finished = false;
    while (!finished) {
      const command = new GetExpenseAnalysisCommand({ JobId: jobId });
      const response = await this.client.send(command);
      if (response.JobStatus === 'SUCCEEDED') {
        finished = true;
        // console.log('res.ExpenseDocuments', response?.ExpenseDocuments);
        const expenseDoc = response?.ExpenseDocuments || [];
        return this.parseInvoiceData(expenseDoc);
      } else if (response.JobStatus === 'FAILED') {
        throw new Error(`Textract job failed for JobId=${jobId}`);
      } else {
        console.log('Job in progress');
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}
