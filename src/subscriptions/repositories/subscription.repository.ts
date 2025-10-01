import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(
    SubscriptionDocument: Partial<Subscription>,
  ): Promise<SubscriptionDocument> {
    const createdSubscription = new this.subscriptionModel(
      SubscriptionDocument,
    );
    return createdSubscription.save();
  }

  async findById(id: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findById(id).exec();
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ stripeSubscriptionId }).exec();
  }

  async update(
    id: string,
    updateSubscriptionDto: Partial<Subscription>,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findByIdAndUpdate(id, updateSubscriptionDto, { new: true })
      .exec();
  }

  async findByUserId(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({
        user: new Types.ObjectId(userId),
        status: SubscriptionStatus.ACTIVE,
      })
      .exec();
  }

  async updateAllByStatusAndExpiry(
    status: SubscriptionStatus,
    start: Date,
    end: Date,
  ) {
    return this.subscriptionModel.updateMany(
      {
        status: status,
        trialExpiresAt: { $gte: start, $lte: end },
      },
      { $set: { status: SubscriptionStatus.EXPIRED } },
    );
  }
}
