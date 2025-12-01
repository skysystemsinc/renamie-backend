import { Injectable, Logger } from '@nestjs/common';
import { PlanSeeder } from './plan.seeder';
import { SeederResult } from './base.seeder';
import { UserSeeder } from './user.seeder';

export interface SeederOptions {
  clearFirst?: boolean;
  seeders?: string[];
}

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly planSeeder: PlanSeeder,
    private readonly userSeeder: UserSeeder,
  ) {}

  async runSeeders(options: SeederOptions = {}): Promise<SeederResult[]> {
    const { clearFirst = false, seeders = ['plans'] } = options;
    const results: SeederResult[] = [];

    this.logger.log('Starting seeder process...');

    for (const seederName of seeders) {
      try {
        this.logger.log(`Processing ${seederName} seeder...`);

        const seeder = this.getSeeder(seederName);
        if (!seeder) {
          results.push({
            success: false,
            message: `Seeder '${seederName}' not found`,
          });
          continue;
        }

        // Clear data first if requested
        if (clearFirst) {
          this.logger.log(`Clearing ${seederName} data...`);
          const clearResult = await seeder.clear();
          results.push({
            ...clearResult,
            message: `[${seederName}] ${clearResult.message}`,
          });
        }

        // Seed data
        this.logger.log(`Seeding ${seederName} data...`);
        const seedResult = await seeder.seed();
        results.push({
          ...seedResult,
          message: `[${seederName}] ${seedResult.message}`,
        });

        this.logger.log(`Completed ${seederName} seeder`);
      } catch (error) {
        this.logger.error(`Error processing ${seederName} seeder:`, error);
        results.push({
          success: false,
          message: `[${seederName}] Failed to process seeder: ${error.message}`,
          error: error.message,
        });
      }
    }

    this.logger.log('Seeder process completed');
    return results;
  }

  async runPlanSeeder(clearFirst = false): Promise<SeederResult[]> {
    return this.runSeeders({ clearFirst, seeders: ['plans'] });
  }
  async runUserSeeder(clearFirst = false): Promise<SeederResult[]> {
  return this.runSeeders({ clearFirst, seeders: ['user'] });
}

  async clearAllSeeders(): Promise<SeederResult[]> {
    const results: SeederResult[] = [];
    const seeders = ['plans'];

    this.logger.log('Clearing all seeder data...');

    for (const seederName of seeders) {
      try {
        const seeder = this.getSeeder(seederName);
        if (seeder) {
          const result = await seeder.clear();
          results.push({
            ...result,
            message: `[${seederName}] ${result.message}`,
          });
        }
      } catch (error) {
        this.logger.error(`Error clearing ${seederName}:`, error);
        results.push({
          success: false,
          message: `[${seederName}] Failed to clear: ${error.message}`,
          error: error.message,
        });
      }
    }

    return results;
  }

  private getSeeder(seederName: string) {
    switch (seederName) {
      case 'plans':
        return this.planSeeder;
      case 'user':
        return this.userSeeder;
      default:
        return null;
    }
  }

  async getSeederStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    try {
      // Get plan count
      const planCount = await this.planSeeder['planModel'].countDocuments();
      status.plans = {
        count: planCount,
        hasData: planCount > 0,
      };
    } catch (error) {
      status.plans = {
        error: error.message,
      };
    }

    return status;
  }
}
