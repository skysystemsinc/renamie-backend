import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument, PlanInterval } from '../payments/schemas/plan.schema';
import { BaseSeeder, SeederResult } from './base.seeder';

@Injectable()
export class PlanSeeder extends BaseSeeder {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
  ) {
    super();
  }

  async seed(): Promise<SeederResult> {
    try {
      // Check if plans already exist
      const existingPlans = await this.planModel.countDocuments();
      if (existingPlans > 0) {
        return {
          success: false,
          message: `Plans already exist (${existingPlans} found). Use clear() first to reset.`,
        };
      }

      const plans = this.getSamplePlans();
      const createdPlans = await this.planModel.insertMany(plans);

      return {
        success: true,
        message: `Successfully seeded ${createdPlans.length} plans`,
        count: createdPlans.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to seed plans',
        error: error.message,
      };
    }
  }

  async clear(): Promise<SeederResult> {
    try {
      const result = await this.planModel.deleteMany({});
      return {
        success: true,
        message: `Successfully cleared ${result.deletedCount} plans`,
        count: result.deletedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clear plans',
        error: error.message,
      };
    }
  }

  private getSamplePlans(): Partial<Plan>[] {
    return [
      {
        stripePriceId: 'price_1TAFSkBIW74O6bIv2MJIbPYo',
        name: 'Starter',
        description: 'Perfect for getting started with basic file management',
        amount: 1900, // 19 dollars in cents
        currency: 'usd',
        interval: PlanInterval.MONTH,
        trialPeriodDays: 15, // 15 days
        features: {
          storage: 100, // 100 pdfs
          folders: 3,
          filesize: 15360, // 15MB in KB
          batch: 10,
          users: 1,
        },
        isActive: true,
        stripeProductId: 'prod_U8WVQnE6dAC3fv',
        order: 1,
        metadata: {},
      },
      {
        stripePriceId: 'price_1TAFSYBIW74O6bIvy07gnbY4',
        name: 'Growth',
        description: 'Ideal for individuals and small teams',
        amount: 3900, // $39 in cents
        currency: 'usd',
        interval: PlanInterval.MONTH,
        trialPeriodDays: 15,
        features: {
          storage: 500, // 500 pdfs
          folders: 5,
          filesize: 25600, // 25MB in KB
          batch: 25,
          users: 3,
        },
        isActive: true,
        stripeProductId: 'prod_U8WV6hnCtHx547',
        order: 2,
        metadata: {},
      },
      {
        stripePriceId: 'price_1TAFSIBIW74O6bIvhv10VPUD',
        name: 'Business',
        description: 'Ideal for individuals and small teams',
        amount: 6900, // $69 in cents
        currency: 'usd',
        interval: PlanInterval.MONTH,
        trialPeriodDays: 15,
        features: {
          storage: 2000, // 2000 pdfs
          folders: 10,
          filesize: 25600, // 25MB in KB
          batch: 35,
          users: 5,
        },
        isActive: true,
        stripeProductId: 'prod_U8WV8AqudRjEHa',
        order: 3,
        metadata: {},
      },
    ];
  }
}
