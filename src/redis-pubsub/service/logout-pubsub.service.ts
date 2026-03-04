import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { SSEService } from 'src/sse/services/sse.service';

const LOGOUT_CHANNEL = 'user:logout';

@Injectable()
export class LogoutPubSubService implements OnModuleInit {
    private subscriber: RedisClientType;

    constructor(
        @Inject('REDIS_PUBSUB_CLIENT') private readonly redis: RedisClientType,
        private readonly sseService: SSEService,
    ) { }

    async onModuleInit() {
        this.subscriber = this.redis.duplicate() as RedisClientType;
        await this.subscriber.connect();

        await this.subscriber.subscribe(LOGOUT_CHANNEL, (message) => {
            if (message) {
                this.sseService.sendLogout(message.trim());
            }
        });
    }

    publishLogout(userId: string): void {
        this.redis.publish(LOGOUT_CHANNEL, userId);
    }
}