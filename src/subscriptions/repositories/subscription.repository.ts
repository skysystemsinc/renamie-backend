import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(SubscriptionDocument: Partial<Subscription>): Promise<SubscriptionDocument> {
    const createdSubscription = new this.subscriptionModel(SubscriptionDocument);
    return createdSubscription.save();
  }

  async findById(id: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findById(id).exec();
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ stripeSubscriptionId }).exec();
  }

  async update(id: string, updateSubscriptionDto: Partial<Subscription>): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findByIdAndUpdate(id, updateSubscriptionDto, { new: true }).exec();
  }
}
