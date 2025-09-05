import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from '../schemas/payment.schema';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentDocument> {
    const createdPayment = new this.paymentModel(createPaymentDto);
    return createdPayment.save();
  }

  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findById(id).exec();
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ stripePaymentIntentId }).exec();
  }

  async findByUserId(userId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: PaymentStatus): Promise<PaymentDocument[]> {
    return this.paymentModel.find({ status }).sort({ createdAt: -1 }).exec();
  }

  async findByOrderId(orderId: string): Promise<PaymentDocument[]> {
    return this.paymentModel.find({ orderId }).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findByIdAndUpdate(id, updatePaymentDto, { new: true })
      .exec();
  }

  async updateByStripePaymentIntentId(
    stripePaymentIntentId: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { stripePaymentIntentId },
        updatePaymentDto,
        { new: true }
      )
      .exec();
  }

  async updateStatus(id: string, status: PaymentStatus, additionalData?: Partial<UpdatePaymentDto>): Promise<PaymentDocument | null> {
    const updateData: any = { status };
    
    if (status === PaymentStatus.SUCCEEDED) {
      updateData.processedAt = new Date();
    }
    
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    return this.paymentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findByIdAndDelete(id).exec();
  }

  async getPaymentStats(userId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    const matchStage: any = {};
    if (userId) {
      matchStage.userId = new Types.ObjectId(userId);
    }

    const stats = await this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', PaymentStatus.SUCCEEDED] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', PaymentStatus.FAILED] }, 1, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
    };
  }
}
