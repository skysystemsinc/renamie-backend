import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: '127.0.0.1', // Redis host (inside WSL)
        port: 6379,        // Default Redis port
      },
    }),
  ],
})
export class QueueModule {}
