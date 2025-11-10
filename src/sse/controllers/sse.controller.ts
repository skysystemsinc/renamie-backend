import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { SSEService } from './services/sse.service';
import type { Response, Request } from 'express';

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
      res.status(400).send('userId required');
      return;
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
