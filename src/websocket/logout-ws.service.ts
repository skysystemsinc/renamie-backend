import { Injectable } from '@nestjs/common';
import { LogoutGateway } from './logout.gateway';

@Injectable()
export class LogoutWsService {
    constructor(private readonly logoutGateway: LogoutGateway) { }

    async logoutUser(userId: string) {
        this.logoutGateway.forceLogout(userId);
    }
}