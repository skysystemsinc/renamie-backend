import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/services/logger.service';
import { PlansModule } from './plans/plans.module';
import { SeedersModule } from './seeders/seeders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import configuration from './config/configuration';
import { StripeModule } from './stripe/stripe.module';
import { S3Module } from './s3/s3.module';
import { FoldersModule } from './folder/folders.module';
import { SendgridService } from './common/services/sendgrid';
import { TasksModule } from './tasks/tasks.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    PaymentsModule,
    HealthModule,
    PlansModule,
    SeedersModule,
    SubscriptionsModule,
    StripeModule,
    S3Module,
    FoldersModule,
    TasksModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    SendgridService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
