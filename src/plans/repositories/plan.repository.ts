import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from '../../payments/schemas/plan.schema';

@Injectable()
export class PlanRepository {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
  ) {}

  async findAll(): Promise<PlanDocument[]> {
    return this.planModel.find({ isActive: true }).sort({ order: 1 }).exec();
  }

  async findById(id: string): Promise<PlanDocument | null> {
    return this.planModel.findById(id).exec();
  }

  async findByStripePriceId(stripePriceId: string): Promise<PlanDocument | null> {
    return this.planModel.findOne({ stripePriceId }).exec();
  }

  async findByInterval(interval: string): Promise<PlanDocument[]> {
    return this.planModel.find({ interval, isActive: true }).sort({ order: 1 }).exec();
  }

  async findActivePlans(): Promise<PlanDocument[]> {
    return this.planModel.find({ isActive: true }).sort({ order: 1 }).exec();
  }
}
