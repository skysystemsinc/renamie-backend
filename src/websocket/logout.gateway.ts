import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    },
})
export class LogoutGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    afterInit() {
        // console.log('Logout WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        const { userId } = client.handshake.query;
        if (userId) {
            client.join(`user-${userId}`);
            //   console.log(`User ${userId} connected to WebSocket`);
        }
    }

    forceLogout(userId: string) {
        this.server.to(`user-${userId}`).emit('FORCE_LOGOUT');
        // console.log(`Sent FORCE_LOGOUT to user-${userId}`);
    }
}