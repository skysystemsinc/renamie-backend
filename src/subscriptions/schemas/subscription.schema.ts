import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Plan, PlanFeatures } from '../../payments/schemas/plan.schema';
import { History, HistroySchema } from './history.schema';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELED = 'canceled',
  TRIALING = 'trialing',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Plan.name, required: true })
  plan: Types.ObjectId;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop({
    required: true,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  canceledAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop()
  trialStartedAt?: Date;
  @Prop()
  trialExpiresAt?: Date;

  // @Prop({ type: [HistroySchema], default: [] })
  // histroy: History[];

  @Prop({ type: PlanFeatures, default: {} })
  features: PlanFeatures;

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ default: null })
  cancelReqAt?: Date;

  @Prop({ default: null })
  activationEmailSent?: boolean;


}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
