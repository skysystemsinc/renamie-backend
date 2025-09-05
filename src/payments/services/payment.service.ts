import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentRepository } from '../repositories/payment.repository';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { Payment, PaymentStatus, PaymentDocument } from '../schemas/payment.schema';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentDocument> {
    try {
      this.logger.log(`Creating payment for user ${createPaymentDto.userId}`);
      return await this.paymentRepository.create(createPaymentDto);
    } catch (error) {
      this.logger.error(`Error creating payment: ${error.message}`);
      throw new BadRequestException('Failed to create payment record');
    }
  }

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<{ payment: PaymentDocument; clientSecret: string }> {
    try {
      this.logger.log(`Processing payment for user ${processPaymentDto.userId}`);

      // Create Stripe Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(processPaymentDto.amount * 100), // Convert to cents
        currency: processPaymentDto.currency.toLowerCase(),
        payment_method_types: [processPaymentDto.paymentMethod],
        description: processPaymentDto.description,
        metadata: {
          userId: processPaymentDto.userId,
          orderId: processPaymentDto.orderId || '',
          ...processPaymentDto.metadata,
        },
        ...(processPaymentDto.paymentMethodId && {
          payment_method: processPaymentDto.paymentMethodId,
        }),
        ...(processPaymentDto.customerEmail && {
          receipt_email: processPaymentDto.customerEmail,
        }),
      });

      // Create payment record in database
      const paymentData: CreatePaymentDto = {
        userId: processPaymentDto.userId,
        amount: processPaymentDto.amount,
        currency: processPaymentDto.currency,
        paymentMethod: processPaymentDto.paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        description: processPaymentDto.description,
        metadata: processPaymentDto.metadata,
        orderId: processPaymentDto.orderId,
        customerEmail: processPaymentDto.customerEmail,
        customerName: processPaymentDto.customerName,
      };

      const payment = await this.createPayment(paymentData);

      return {
        payment,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      this.logger.error(`Error processing payment: ${error.message}`);
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw new BadRequestException('Failed to process payment');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    try {
      this.logger.log(`Confirming payment intent: ${paymentIntentId}`);

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Find payment in database
      const payment: PaymentDocument | null = await this.paymentRepository.findByStripePaymentIntentId(paymentIntentId);
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Update payment status based on Stripe status
      let status: PaymentStatus;
      let additionalData: Partial<UpdatePaymentDto> = {};

      switch (paymentIntent.status) {
        case 'succeeded':
          status = PaymentStatus.SUCCEEDED;
          additionalData.stripeChargeId = paymentIntent.latest_charge as string;
          break;
        case 'processing':
          status = PaymentStatus.PROCESSING;
          break;
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          status = PaymentStatus.PENDING;
          break;
        case 'canceled':
          status = PaymentStatus.CANCELED;
          break;
        default:
          status = PaymentStatus.FAILED;
          additionalData.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      }

      const updatedPayment = await this.paymentRepository.updateStatus(
        payment.id.toString(),
        status,
        additionalData,
      );

      return updatedPayment!;
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`);
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw error;
    }
  }

  async refundPayment(refundPaymentDto: RefundPaymentDto): Promise<PaymentDocument> {
    try {
      this.logger.log(`Processing refund for payment ${refundPaymentDto.paymentId}`);

      // Find payment in database
      const payment: PaymentDocument | null = await this.paymentRepository.findById(refundPaymentDto.paymentId);
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status !== PaymentStatus.SUCCEEDED) {
        throw new BadRequestException('Only successful payments can be refunded');
      }

      if (payment.refundedAmount && payment.refundedAmount >= payment.amount) {
        throw new BadRequestException('Payment has already been fully refunded');
      }

      const refundAmount = refundPaymentDto.amount || payment.amount;
      const remainingAmount = payment.amount - (payment.refundedAmount || 0);

      if (refundAmount > remainingAmount) {
        throw new BadRequestException('Refund amount exceeds remaining amount');
      }

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: refundPaymentDto.reason as any,
        metadata: {
          refundNotes: refundPaymentDto.notes || '',
        },
      });

      // Update payment record
      const newRefundedAmount = (payment.refundedAmount || 0) + refundAmount;
      const updateData: UpdatePaymentDto = {
        refundedAmount: newRefundedAmount,
        refundedAt: new Date(),
        status: newRefundedAmount >= payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.SUCCEEDED,
      };

      const updatedPayment = await this.paymentRepository.update(
        payment.id.toString(),
        updateData,
      );

      return updatedPayment!;
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`);
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentRepository.findAll();
  }

  async findById(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByUserId(userId: string): Promise<PaymentDocument[]> {
    return this.paymentRepository.findByUserId(userId);
  }

  async findByOrderId(orderId: string): Promise<PaymentDocument[]> {
    return this.paymentRepository.findByOrderId(orderId);
  }

  async getPaymentStats(userId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    return this.paymentRepository.getPaymentStats(userId);
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentDocument> {
    const payment = await this.paymentRepository.update(id, updatePaymentDto);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async deletePayment(id: string): Promise<void> {
    const payment = await this.paymentRepository.delete(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
  }

  // Webhook handler for Stripe events
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment: PaymentDocument | null = await this.paymentRepository.findByStripePaymentIntentId(paymentIntent.id);
    if (payment) {
      await this.paymentRepository.updateStatus(payment.id.toString(), PaymentStatus.SUCCEEDED, {
        stripeChargeId: paymentIntent.latest_charge as string,
      });
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment: PaymentDocument | null = await this.paymentRepository.findByStripePaymentIntentId(paymentIntent.id);
    if (payment) {
      await this.paymentRepository.updateStatus(payment.id.toString(), PaymentStatus.FAILED, {
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      });
    }
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment: PaymentDocument | null = await this.paymentRepository.findByStripePaymentIntentId(paymentIntent.id);
    if (payment) {
      await this.paymentRepository.updateStatus(payment.id.toString(), PaymentStatus.CANCELED);
    }
  }
}
