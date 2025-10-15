// src/worker/main.worker.ts
import { NestFactory } from '@nestjs/core';
import { QueueModule } from '../queue/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);
  console.log('✅ BullMQ Worker is running...');

  const shutdown = async () => {
    console.log('🛑 Shutting down worker...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise(() => {}); // keep alive
}

bootstrap();
