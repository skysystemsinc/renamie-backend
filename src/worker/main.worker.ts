// src/worker/main.worker.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { QueueModule } from '../queue/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise(() => {}); // keep alive
}

bootstrap();
