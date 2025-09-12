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
import { MailService } from './common/services/mailer.service';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.EMAIL_FROM}>`,
      },
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    MailService,
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
