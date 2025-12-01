// }
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

@Injectable()
export class SSEService {
  private clients: Map<string, Response> = new Map();

  addClient(userId: string, res: Response) {
    this.clients.set(userId, res);
    // console.log(
    //   `SSE client added: ${userId} | Total clients: ${this.clients.size}`,
    // );
  }

  removeClient(userId: string) {
    this.clients.delete(userId);
    // console.log(
    //   `SSE client removed: ${userId} | Total clients: ${this.clients.size}`,
    // );
  }

  sendLogout(userId: string, res?: Response) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`event: logout\ndata: "USER_LOGOUT"\n\n`);
    }
  }

  sendSubscriptionCancelled(userId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`event: subscription_cancelled\n`);
      client.write(
        `data: ${JSON.stringify({ message: 'subscription_cancelled' })}\n\n`,
      );
      // console.log(`SE event sent to collaborator ${userId}`);
    } else {
      console.warn(`[SSEService] No SSE client found for user: ${userId}`);
    }
  }
}


