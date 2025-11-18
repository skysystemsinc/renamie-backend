// import { Injectable } from '@nestjs/common';
// import { Response } from 'express';

// @Injectable()
// export class SSEService {
//   private clients: Map<string, Response> = new Map();

//   addClient(userId: string, res: Response) {
//     this.clients.set(userId, res);
//   }

//   removeClient(userId: string) {
//     this.clients.delete(userId);
//   }

//   sendLogout(userId: string) {
//     const client = this.clients.get(userId);
//     if (client) {
//       client.write(`event: logout\ndata: "USER_LOGOUT"\n\n`);
//     }
//   }

//   // When subscription is cancelled
//   sendSubscriptionCancelled(userId: string) {
//     const client = this.clients.get(userId);
//     console.log(
//       'TRYING TO SEND SUB CANCEL →',
//       userId,
//       'CLIENT EXISTS? →',
//       this.clients.has(userId),
//     );
//     if (client) {
//       client.write(`event: subscription_cancelled\ndata: "SUB_CANCELLED"\n\n`);
//     }
//   }
// }

import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SSEService {
  // Support multiple tabs per user
  private clients: Map<string, Set<Response>> = new Map();

  addClient(userId: string, res: Response) {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)?.add(res);
  }

  removeClient(userId: string, res: Response) {
    if (!this.clients.has(userId)) return;
    this.clients.get(userId)?.delete(res);
    if (this.clients.get(userId)?.size === 0) this.clients.delete(userId);
  }

  private sendEvent(userId: string, eventName: string, data: string) {
    const payload = `event: ${eventName}\ndata: ${data}\n\n`;
    const userClients = this.clients.get(userId);
    if (userClients && userClients.size > 0) {
      userClients.forEach((res) => res.write(payload));
    }
  }

  sendLogout(userId: string) {
    this.sendEvent(userId, 'logout', '"USER_LOGOUT"');
  }

  sendSubscriptionCancelled(userId: string) {
    this.sendEvent(userId, 'subscription_cancelled', '"SUB_CANCELLED"');
  }
}
