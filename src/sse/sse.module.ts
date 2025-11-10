import { Module } from '@nestjs/common';
import { SSEController } from './controllers/sse.controller';
import { SSEService } from './services/sse.service';

@Module({
  controllers: [SSEController],
  providers: [SSEService],
  exports: [SSEService],
})
export class SSEModule {}
