import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { SSEService } from '../services/sse.service';

@Controller('sse')
export class SSEController {
  constructor(private readonly sseService: SSEService) {}

  @Get()
  connect(
    @Query('userId') userId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (!userId) {
      if (!userId) throw new NotFoundException('User not found');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ userId })}\n\n`);
    this.sseService.addClient(userId, res);

    req.on('close', () => {
      this.sseService.removeClient(userId);
      res.end();
    });
  }
}
