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
import { SendgridService } from 'src/common/services/sendgrid';
import { UserSchema } from 'src/users/schemas/user.schema';
import { UsersModule } from 'src/users/users.module';
import { PlansModule } from 'src/plans/plans.module';
import { SSEService } from 'src/sse/services/sse.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
     FirebaseModule,
     UsersModule,
     PlansModule
  ],
  providers: [StripeService, SubscriptionRepository, SendgridService, SSEService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
