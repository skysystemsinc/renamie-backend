import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import configuration from './config/configuration';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
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
