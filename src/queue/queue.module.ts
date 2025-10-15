// import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bullmq';
// @Module({
//   imports: [
//     BullModule.forRoot({
//       connection: {
//         host: '127.0.0.1', // Redis host (inside WSL)
//         port: 6379,        // Default Redis port
//       },
//     }),
//   ],
// })
// export class QueueModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}

