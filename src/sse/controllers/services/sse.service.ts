import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SSEService {
  private clients: Map<string, Response> = new Map();

  addClient(userId: string, res: Response) {
    this.clients.set(userId, res);
  }

  removeClient(userId: string) {
    this.clients.delete(userId);
  }

  sendLogout(userId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`event: logout\ndata: "USER_LOGOUT"\n\n`);
    }
  }
  sendFileStatusUpdate(userId: string, files: any[]) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`event: file-status-update\n`);
      client.write(`data: ${JSON.stringify({ message: 'Files marked as deleted', files })}\n\n`);
    }
  }
}
