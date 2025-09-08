import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Plan } from '../../payments/schemas/plan.schema';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
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

  @Prop({ required: true })
  stripeSubscriptionId: string;

  @Prop({ required: true, enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  canceledAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
