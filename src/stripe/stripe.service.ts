import { Injectable, Logger, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SubscriptionRepository } from '../subscriptions/repositories/subscription.repository';
import {
  SubscriptionDocument,
  SubscriptionStatus,
} from '../subscriptions/schemas/subscription.schema';
import { Request } from 'express';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Types } from 'mongoose';
import { SendgridService } from 'src/common/services/sendgrid';
import { UserService } from 'src/users/services/user.service';
import { PlanService } from 'src/plans/services/plan/plan.service';
import { formatDate } from 'src/utils/helper';

const mapStripeStatus = (status: string): SubscriptionStatus => {
  switch (status) {
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'expired':
      return SubscriptionStatus.EXPIRED;
    default:
      return SubscriptionStatus.PENDING;
  }
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly firebaseService: FirebaseService,
    private readonly sendgridService: SendgridService,
    private readonly userService: UserService,
    private readonly planService: PlanService,
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

  // updated stripe susbcription
  async updateStripeSubscription(id: string) {
    try {
      return await this.stripe.subscriptions.update(id, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      this.logger.error(`Error updating Stripe subscription: ${error.message}`);
      throw new Error(`Failed to update Stripe subscription: ${error.message}`);
    }
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
        success_url: `${this.configService.get('FRONTEND_URL')}dashboard/pricing?success`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}dashboard/pricing?cancel`,
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
          trial_period_days: 15,
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

    const subsStartAt = new Date(subscription.start_date * 1000);
    let subsEndAt = new Date();
    if (subscription.items.data[0].plan.interval === 'month') {
      subsEndAt.setDate(subsStartAt.getDate() + 30);
    }

    if (
      existingSubscription?.status === SubscriptionStatus.PENDING &&
      subscription?.status === SubscriptionStatus.TRIALING
    ) {
      if (subscription && subscription?.trial_start) {
        const trailStartDate = new Date(subscription?.trial_start * 1000);
        const trialExpiresAt = new Date(trailStartDate);
        trialExpiresAt.setDate(trailStartDate.getDate() + 15);

        const updatedSubscription = await this.subscriptionRepository.update(
          existingSubscription.id,
          {
            status: mapStripeStatus(subscription?.status),
            startedAt: subsStartAt,
            expiresAt: subsEndAt,
            trialExpiresAt: trialExpiresAt,
            stripeSubscriptionId: subscription?.id,
          },
        );
        if (!updatedSubscription) {
          this.logger.log(
            `Subscription not updated at trailing: ${subscription.id} for customer ${subscription.customer}`,
          );
          return;
        }

        this.logger.log(
          `Subscription updated: ${updatedSubscription.id} for customer ${subscription.customer}`,
        );

        // send trailing email
        const getUser = await this.userService.findById(
          existingSubscription?.user.toString(),
        );
        if (!getUser) return;
        const getplan = await this.planService.findById(
          existingSubscription?.plan.toString(),
        );
        if (!getplan) return;
        await this.sendgridService.sendTrailingEmail(
          getUser?.email,
          getUser?.firstName,
          formatDate(trailStartDate),
          formatDate(trialExpiresAt),
          getplan?.name,
        );

        //   // Save subscription in Firebase
        try {
          const db = this.firebaseService.getDb();
          const userId: string =
            updatedSubscription.user instanceof Types.ObjectId
              ? updatedSubscription.user.toString()
              : String(updatedSubscription.user);
          const subscriptionId: string =
            updatedSubscription._id instanceof Types.ObjectId
              ? updatedSubscription._id.toString()
              : String(updatedSubscription._id);

          const planId: string =
            updatedSubscription.plan instanceof Types.ObjectId
              ? updatedSubscription.plan.toString()
              : String(updatedSubscription.plan);

          await db.ref(`users/${userId}/subscription`).set({
            _id: subscriptionId,
            plan: planId,
            userId: userId,
            status: subscription?.status,
          });

          this.logger.log(
            `✅ Subscription stored in Firebase for user ${userId}`,
          );
        } catch (err) {
          this.logger.error(
            `Failed to save subscription in   Firebase: ${err.message}`,
          );
        }
      }
    }
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

    if (subscription?.status === SubscriptionStatus.ACTIVE) {
      const metadata = subscription.metadata;

      let existingSubscription: SubscriptionDocument | null =
        await this.subscriptionRepository.findById(metadata.subscriptionId);
      if (!existingSubscription) {
        this.logger.log(`Subscription not found in DB: ${subscription.id}`);
        return;
      }

      const updatedSubscription = await this.subscriptionRepository.update(
        existingSubscription.id,
        {
          status: mapStripeStatus(subscription?.status),
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

      try {
        const db = this.firebaseService.getDb();
        const userId: string =
          updatedSubscription.user instanceof Types.ObjectId
            ? updatedSubscription.user.toString()
            : String(updatedSubscription.user);
        const subscriptionId: string =
          updatedSubscription._id instanceof Types.ObjectId
            ? updatedSubscription._id.toString()
            : String(updatedSubscription._id);

        const planId: string =
          updatedSubscription.plan instanceof Types.ObjectId
            ? updatedSubscription.plan.toString()
            : String(updatedSubscription.plan);

        await db.ref(`users/${userId}/subscription`).set({
          _id: subscriptionId,
          plan: planId,
          userId: userId,
          status: subscription?.status,
        });

        this.logger.log(`Subscription stored in Firebase for user ${userId}`);
      } catch (err) {
        this.logger.error(
          `Failed to save subscription in   Firebase: ${err.message}`,
        );
      }
    }
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
    const metadata = subscription.metadata;
    let existingSubscription: SubscriptionDocument | null =
      await this.subscriptionRepository.findById(metadata.subscriptionId);

    if (!existingSubscription) {
      this.logger.log(
        `Subscription not found in DB for deleted Stripe ID: ${subscription.id}`,
      );
      return;
    }

    const updatedSubscription = await this.subscriptionRepository.update(
      existingSubscription.id,
      {
        status: mapStripeStatus(subscription?.status),
        canceledAt: new Date(),
      },
    );

    if (!updatedSubscription) {
      this.logger.error(
        `Failed to update local subscription status for deleted ID: ${existingSubscription.id}`,
      );
      return;
    }

    this.logger.log(
      `Subscription ${updatedSubscription.id} successfully marked as CANCELED in DB.`,
    );

    try {
      const db = this.firebaseService.getDb();
      const userId: string =
        updatedSubscription.user instanceof Types.ObjectId
          ? updatedSubscription.user.toString()
          : String(updatedSubscription.user);
      const subscriptionId: string =
        updatedSubscription._id instanceof Types.ObjectId
          ? updatedSubscription._id.toString()
          : String(updatedSubscription._id);

      const planId: string =
        updatedSubscription.plan instanceof Types.ObjectId
          ? updatedSubscription.plan.toString()
          : String(updatedSubscription.plan);

      await db.ref(`users/${userId}/subscription`).set({
        _id: subscriptionId,
        plan: planId,
        userId: userId,
        status: subscription?.status,
      });

      this.logger.log(`Subscription stored in Firebase for user ${userId}`);
    } catch (err) {
      this.logger.error(
        `Failed to save subscription in   Firebase: ${err.message}`,
      );
    }
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

  // async retriveStripeSubscription(
  // )
}
