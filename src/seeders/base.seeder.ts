import { Injectable } from '@nestjs/common';

export interface SeederResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

@Injectable()
export abstract class BaseSeeder {
  abstract seed(): Promise<SeederResult>;
  abstract clear(): Promise<SeederResult>;
}
