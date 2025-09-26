import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { S3Service } from '../../common/services/s3.service';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { ClassConstructor } from 'class-transformer';
import pdfParse from 'pdf-parse';

@Injectable()
export class LLMService {
  private readonly ai: GoogleGenAI;

  constructor(private readonly s3Service: S3Service) {
    this.ai = new GoogleGenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1',
    } as any);
  }

  private getJsonSchema(dto: ClassConstructor<any>): any {
    const properties: Record<string, any> = {};
    for (const key in new dto()) {
      properties[key] = { type: 'string' };
    }
    return {
      type: Type.OBJECT,
      properties: properties,
    };
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async extractInvoiceData<T>(
    fileKey: string,
    schema: ClassConstructor<T>,
  ): Promise<T> {
    try {
      const fileStream = await this.s3Service.downloadFile(fileKey);
      const fileBuffer = await this.streamToBuffer(fileStream);
      console.log('fileStream', fileStream);
      console.log('fileBuffer', fileBuffer);
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new BadRequestException(
          'Could not download file or file is empty.',
        );
      }

      const pdfData = await pdfParse(fileBuffer);
      const rawText = pdfData.text;
      console.log('pdfData ', pdfData);
      console.log('rawText', rawText);

      const prompt = `You are a financial data extractor. Analyze the document text below and extract the invoice number, date, total amount (as a number), vendor name, and line items (description and amount). Return ONLY a JSON object conforming strictly to the provided schema.
        DOCUMENT TEXT:
        ---
        ${rawText}
        ---
        `;

      //   console.log('prompt', prompt);
      const response: GenerateContentResponse =
        await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: this.getJsonSchema(schema),
          },
        });

      if (!response.text) {
        throw new InternalServerErrorException(
          'LLM returned an empty response.',
        );
      }

      const jsonText = response.text.trim().replace(/```json\n|```/g, '');
      const structuredJson = JSON.parse(jsonText);
      return structuredJson;
    } catch (error) {
      console.error('LLM Extraction Error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `LLM processing failed: ${error.message}`,
      );
    }
  }
}
