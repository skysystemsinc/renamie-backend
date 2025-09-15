import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { PaymentService } from '../../payments/services/payment.service';
import { CreatePaymentDto } from 'src/payments/dto/create-payment.dto';
import { PlanService } from 'src/plans/services/plan/plan.service';
import { UserService } from 'src/users/services/user.service';
import { StripeService } from 'src/stripe/stripe.service';
import { UserDocument } from 'src/users/schemas/user.schema';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly paymentService: PaymentService,
        private readonly planService: PlanService,
        private readonly userService: UserService,
        private readonly stripeService: StripeService
    ) { }

    async createSubscription(createSubscriptionDto: CreateSubscriptionDto, userId: string) {
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
        if (!customer || customer === "") {
            // Create Stripe customer if not already created
            customer = await this.stripeService.createStripeCustomer(user as UserDocument, plan.name);

            // Update user with Stripe Customer ID
            await this.userService.update(userId, { stripeCustomerId: customer } as UpdateUserDto);
        }

        const subscription = await this.subscriptionRepository.create({
            plan: new Types.ObjectId(plan.id),
            user: new Types.ObjectId(userId),
            status: SubscriptionStatus.PENDING
        });
        const checkoutSession = await this.stripeService.createCheckoutSession(
            customer,
            plan.stripePriceId,
            subscription.id,
            userId
            
        );
        return checkoutSession;
        // return this.paymentService.createPayment(createSubscriptionDto as CreatePaymentDto, userId);
    }

    async findByUserId(userId: string) {
        return this.subscriptionRepository.findByUserId(userId);
    }
}
