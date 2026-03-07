import { Module } from '@nestjs/common';
import { LogoutGateway } from './logout.gateway';
import { LogoutWsService } from './logout-ws.service';

@Module({
  providers: [LogoutGateway, LogoutWsService],
  exports: [LogoutWsService],
})
export class LogoutWsModule {}