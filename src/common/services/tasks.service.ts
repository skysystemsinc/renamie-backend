import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionRepository } from 'src/subscriptions/repositories/subscription.repository';
import { SubscriptionStatus } from 'src/subscriptions/schemas/subscription.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    // this.logger.debug('Called when the current second is 45');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfYesterday = new Date(
      yesterday.toISOString().split('T')[0] + 'T00:00:00.000Z',
    );
    const endOfYesterday = new Date(
      yesterday.toISOString().split('T')[0] + 'T23:59:59.999Z',
    );

    const expiredTrials =
      await this.subscriptionRepository.updateAllByStatusAndExpiry(
        SubscriptionStatus.TRIALING,
        startOfYesterday,
        endOfYesterday,
      );
  }
}
