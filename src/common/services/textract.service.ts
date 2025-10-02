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
  private readonly logger = new Logger(TextractService.name);
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

      this.logger.log(
        `Started Textract expense analysis: JobId=${response.JobId}`,
      );
      return response.JobId;
    } catch (err) {
      this.logger.error('Failed to start expense analysis', err.stack || err);
      throw err;
    }
  }

  async getInvoiceAnalysis(
    jobId: string,
  ): Promise<GetExpenseAnalysisCommandOutput[]> {
    const results: GetExpenseAnalysisCommandOutput[] = [];

    try {
      let finished = false;
      let nextToken: string | undefined = undefined;

      while (!finished) {
        const command = new GetExpenseAnalysisCommand({
          JobId: jobId,
          NextToken: nextToken,
        });

        const response = await this.client.send(command);
        if (response.JobStatus === 'SUCCEEDED') {
          results.push(response);
          // nextToken = response.NextToken;

          if (!nextToken) {
            finished = true;
          }
        } else if (response.JobStatus === 'FAILED') {
          throw new Error(`Textract job failed for JobId=${jobId}`);
        } else {
          this.logger.debug(`Job ${jobId} still in progress... waiting 5s`);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }

      this.logger.log(`Completed Textract job: JobId=${jobId}`);
      return results;
    } catch (err) {
      this.logger.error(
        `Error fetching expense analysis for JobId=${jobId}`,
        err.stack || err,
      );
      throw err;
    }
  }
}
