import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './controllers/stripe.controller';
import { SubscriptionRepository } from '../subscriptions/repositories/subscription.repository';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscriptions/schemas/subscription.schema';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
     FirebaseModule,
  ],
  providers: [StripeService, SubscriptionRepository],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
