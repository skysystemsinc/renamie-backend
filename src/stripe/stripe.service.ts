import { Injectable, Logger, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UserDocument } from '../users/schemas/user.schema';
import { SubscriptionRepository } from '../subscriptions/repositories/subscription.repository';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from '../subscriptions/schemas/subscription.schema';
import { Request } from 'express';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    if (!this.configService.get<string>('STRIPE_WEBHOOK_SECRET')) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createStripeCustomer(
    user: UserDocument,
    planName?: string,
  ): Promise<string> {
    try {
      this.logger.log(`Creating Stripe customer for user ${user.email}`);

      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
        },
      });

      this.logger.log(
        `Created Stripe customer ${customer.id} for user ${user.email}`,
      );
      return customer.id;
    } catch (error) {
      this.logger.error(`Error creating Stripe customer: ${error.message}`);
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  async getStripeCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      this.logger.log(`Retrieving Stripe customer ${customerId}`);
      return (await this.stripe.customers.retrieve(
        customerId,
      )) as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Error retrieving Stripe customer: ${error.message}`);
      throw new Error(`Failed to retrieve Stripe customer: ${error.message}`);
    }
  }

  async updateStripeCustomer(
    customerId: string,
    updateData: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    try {
      this.logger.log(`Updating Stripe customer ${customerId}`);
      return await this.stripe.customers.update(customerId, updateData);
    } catch (error) {
      this.logger.error(`Error updating Stripe customer: ${error.message}`);
      throw new Error(`Failed to update Stripe customer: ${error.message}`);
    }
  }

  async deleteStripeCustomer(
    customerId: string,
  ): Promise<Stripe.DeletedCustomer> {
    try {
      this.logger.log(`Deleting Stripe customer ${customerId}`);
      return await this.stripe.customers.del(customerId);
    } catch (error) {
      this.logger.error(`Error deleting Stripe customer: ${error.message}`);
      throw new Error(`Failed to delete Stripe customer: ${error.message}`);
    }
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    subscriptionId: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      this.logger.log(
        `Creating Stripe checkout session for customer ${customerId}`,
      );

      return await this.stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${this.configService.get('FRONTEND_URL')}dashboard?success`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}dashboard?cancel`,
        // consent_collection: {
        //   terms_of_service: 'required',
        // },
        metadata: {
          subscriptionId: subscriptionId,
          customerId: customerId,
          priceId: priceId,
          description: 'Subscription for Plan',
        },
        subscription_data: {
          metadata: {
            subscriptionId,
            customerId,
            priceId,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error creating Stripe subscription: ${error.message}`);
      throw new Error(`Failed to create Stripe subscription: ${error.message}`);
    }
  }

  // Webhook handler for Stripe events
  async handleStripeWebhook(req: RawBodyRequest<Request>): Promise<void> {
    this.logger.log(`Handling Stripe webhook`);
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    const rawBody = req.rawBody as Buffer;

    if (!rawBody || !sig || !webhookSecret) {
      this.logger.error('Missing required webhook data');
      throw new Error('Missing required webhook data');
    }

    let event: Stripe.Event;
    event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    switch (event.type) {
      // Checkout session events
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      // Subscription events
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      // Invoice events
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      // Payment intent events (keeping existing ones)
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  // Checkout session event handlers
  private async handleCheckoutSessionCompleted(
    checkoutSession: Stripe.Checkout.Session,
  ): Promise<void> {
    this.logger.log(
      `Checkout session completed: ${checkoutSession.id} for customer ${checkoutSession.customer}`,
    );
    const metadata: any = checkoutSession.metadata;

    const existingSubscription: SubscriptionDocument | null =
      await this.subscriptionRepository.findById(metadata.subscriptionId);
    if (!existingSubscription) {
      this.logger.log(
        `Subscription not found: ${metadata.subscriptionId} for customer ${checkoutSession.customer}`,
      );
      return;
    }

    // await this.subscriptionRepository.update(existingSubscription.id, {
    //   stripeSubscriptionId: checkoutSession.subscription as string,
    //   status: SubscriptionStatus.PENDING,
    // });
  }

  // Subscription event handlers
  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(
      `Subscription created: ${subscription.id} for customer ${subscription.customer}`,
    );

    const metadata = subscription.metadata;
    console.log('Subscription Metadata:', metadata);
    let existingSubscription: SubscriptionDocument | null =
      await this.subscriptionRepository.findById(metadata.subscriptionId);

    if (!existingSubscription && metadata?.subscriptionId) {
      existingSubscription = await this.subscriptionRepository.findById(
        metadata.subscriptionId,
      );
      this.logger.log(
        `Fallback found subscription by metadata: ${metadata.subscriptionId}`,
      );
    }

    if (!existingSubscription) {
      this.logger.log(`Subscription not found in DB: ${subscription.id}`);
      return;
    }

    // Update user subscription status in database
    const updatedSubscription = await this.subscriptionRepository.update(
      existingSubscription.id,
      {
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(subscription.start_date * 1000),
        expiresAt: new Date(
          subscription.items.data[0].current_period_end * 1000,
        ),
      },
    );
    if (!updatedSubscription) {
      this.logger.log(
        `Subscription not updated: ${subscription.id} for customer ${subscription.customer}`,
      );
      return;
    }

    this.logger.log(
      `Subscription updated: ${updatedSubscription.id} for customer ${subscription.customer}`,
    );

    // TODO: Send welcome email to user
    // TODO: Grant access to premium features
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(
      `Subscription updated: ${subscription.id} for customer ${subscription.customer}`,
    );
    // TODO: Update subscription details in database
    // TODO: Handle plan changes (upgrade/downgrade)
    // TODO: Update user access permissions
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.log(
      `Subscription deleted: ${subscription.id} for customer ${subscription.customer}`,
    );
    // TODO: Revoke premium access
    // TODO: Update user subscription status to inactive
    // TODO: Send cancellation confirmation email
    // TODO: Schedule data retention period
  }

  // Invoice event handlers
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    this.logger.log(
      `Invoice payment succeeded: ${invoice.id} for customer ${invoice.customer}`,
    );
    // TODO: Update subscription renewal date
    // TODO: Send payment confirmation email
    // TODO: Extend subscription period
    // TODO: Log successful payment for analytics
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    this.logger.log(
      `Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`,
    );
    // TODO: Send payment failure notification email
    // TODO: Update subscription status to past_due
    // TODO: Implement retry logic for failed payments
    // TODO: Set up dunning management
  }

  // Payment intent event handlers (existing)
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // TODO: Handle one-time payment success
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);
    // TODO: Handle one-time payment failure
  }

  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment intent canceled: ${paymentIntent.id}`);
    // TODO: Handle one-time payment cancellation
  }
}
