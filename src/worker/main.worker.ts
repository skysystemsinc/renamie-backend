// src/worker/main.worker.ts
import { NestFactory } from '@nestjs/core';
import { QueueModule } from '../queue/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);
  console.log('✅ BullMQ Worker is running...');
}

bootstrap();
