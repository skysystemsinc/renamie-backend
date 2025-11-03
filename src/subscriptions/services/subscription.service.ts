import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { PaymentService } from '../../payments/services/payment.service';
import { PlanService } from 'src/plans/services/plan/plan.service';
import { UserService } from 'src/users/services/user.service';
import { StripeService } from 'src/stripe/stripe.service';
import { UserDocument } from 'src/users/schemas/user.schema';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { SubscriptionStatus } from '../schemas/subscription.schema';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentService: PaymentService,
    private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
    userId: string,
  ) {
    // check if user exists

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // check if plan exists
    const plan = await this.planService.findById(createSubscriptionDto.planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // check if user has stripe customer id
    let customer = user.stripeCustomerId;
    if (!customer || customer === '') {
      // Create Stripe customer if not already created
      customer = await this.stripeService.createStripeCustomer(
        user as UserDocument,
        plan.name,
      );
      // Update user with Stripe Customer ID
      await this.userService.update(userId, {
        stripeCustomerId: customer,
      } as UpdateUserDto);
    }

    // Find User active subscription
    const userSubs =
      await this.subscriptionRepository.findBySubsWithActiveAndTrialingStatus(
        userId,
      );
    // if found update subscription
    if (userSubs) {
      const allPriceAndProducts =
        await this.planService.findAllPriceAndProduct();
      // create stripe configuration
      const products = allPriceAndProducts.map((item) => ({
        product: item.stripeProductId,
        prices: [item.stripePriceId],
      }));
      const config = {
        features: {
          subscription_update: {
            default_allowed_updates: ['price'],
            enabled: true,
            proration_behavior: 'none',
            products: products,
          },
          payment_method_update: {
            enabled: true,
          },
        },
        default_return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/pricing?success`,
        name: `Subscription Update for customer`,
      };
      const configuration =
        await this.stripeService.createBillingPortalConfiguration(config);

      // create stripe customer portal
      if (configuration?.id) {
        const sessionConfig = {
          customer: customer,
          return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/pricing?success`,
          configuration: configuration?.id,
        };
        const session =
          await this.stripeService.createBillingPortalSession(sessionConfig);
        return session;
      }
    } else {
      let existingSubscription =
        await this.subscriptionRepository.findSubsByUserId(userId);
      const previousSubs = existingSubscription ? true : false;
      const subscription = await this.subscriptionRepository.create({
        plan: new Types.ObjectId(plan.id),
        user: new Types.ObjectId(userId),
        status: SubscriptionStatus.PENDING,
        features: plan?.features,
      });
      const checkoutSession = await this.stripeService.createCheckoutSession(
        customer,
        plan.stripePriceId,
        subscription.id,
        previousSubs,
      );
      return checkoutSession;
    }
    // return this.paymentService.createPayment(createSubscriptionDto as CreatePaymentDto, userId);
  }

  async findByUserId(userId: string) {
    return this.subscriptionRepository.findByUserId(userId);
  }

  // cencel susbcription
  async cancelSubscription(id: string, userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let customer = user.stripeCustomerId;
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundException('subscription not found');
    }
    const config = {
      features: {
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          proration_behavior: 'none',
        },
      },
      default_return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/pricing?cancel`,
      name: `Subscription Update for customer`,
    };
    const configuration =
      await this.stripeService.createBillingPortalConfiguration(config);

    if (configuration?.id) {
      const sessionConfig = {
        customer: customer,
        return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/pricing?cancel`,
        configuration: configuration?.id,
      };
      const session =
        await this.stripeService.createBillingPortalSession(sessionConfig);
      return session;
    }

    // const stripeSubscriptionId = subscription?.stripeSubscriptionId;
    // return await this.stripeService.updateStripeSubscription(
    //   stripeSubscriptionId,
    // );
  }

  // billing
  async createBillingPortal(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let customer = user.stripeCustomerId;
    const config = {
      features: {
        invoice_history: {
          enabled: true,
        },
      },
      default_return_url: `${this.configService.get('FRONTEND_URL')}/dashboard`,
      name: `Billing`,
    };
    const configuration =
      await this.stripeService.createBillingPortalConfiguration(config);

    if (configuration?.id) {
      const sessionConfig = {
        customer: customer,
        return_url: `${this.configService.get('FRONTEND_URL')}/dashboard`,
        configuration: configuration?.id,
      };
      const session =
        await this.stripeService.createBillingPortalSession(sessionConfig);
      return session;
    }
  }

  // find
  async findSubsByUserId(userId: string) {
    return this.subscriptionRepository.findUserSubs(userId);
  }

  async findUserActiveOrTrialingSubs(userId: string) {
    return this.subscriptionRepository.findBySubsWithActiveAndTrialingStatus(
      userId,
    );
  }

  // get usage
  async getUsage(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const subscription =
      await this.subscriptionRepository.findBySubsWithActiveAndTrialingStatus(
        userId,
      );
    if (!subscription) {
      throw new NotFoundException('subscription not found');
    }
    return {
      folderCount: user?.folderCount,
      fileCount: user?.fileCount,
      userCount: user?.userCount,
      features: subscription?.features,
    };
  }
}
