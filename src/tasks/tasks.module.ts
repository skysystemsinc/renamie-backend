import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionRepository } from 'src/subscriptions/repositories/subscription.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from 'src/subscriptions/schemas/subscription.schema';
import { TasksService } from 'src/common/services/tasks.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
  ],
  providers: [TasksService, SubscriptionRepository],
})
export class TasksModule {}
