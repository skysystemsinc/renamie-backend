import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PlanDocument = Plan & Document;

export enum PlanInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class PlanFeatures {
  @Prop({ type: Number, default: 0 })
  storage: number;

  @Prop({ type: Number, default: 0 })
  folders: number; // allowed folders

  @Prop({ type: Number, default: 0 })
  filesize: number; // allowed filesize in KB

  @Prop({ type: Number, default: 0 })
  batch: number; // allowed batch size

  @Prop({ type: Number, default: 0 })
  users: number; // allowed users
}

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true })
  stripePriceId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  amount: number; // in cents

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, enum: PlanInterval })
  interval: PlanInterval;

  @Prop({ default: 0 })
  trialPeriodDays?: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop({ type: PlanFeatures, default: {} })
  features: PlanFeatures;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  stripeProductId?: string;

  @Prop({ type: Number, default: 0 })
  order: number; // order of the plan
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

// Add indexes for better query performance
PlanSchema.index({ isActive: 1 });
PlanSchema.index({ interval: 1 });
PlanSchema.index({ amount: 1 });
PlanSchema.index({ stripeProductId: 1 });
PlanSchema.index({ order: 1 });
