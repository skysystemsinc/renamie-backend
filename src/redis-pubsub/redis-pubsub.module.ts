import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { SSEModule } from '../sse/sse.module';
import { LogoutPubSubService } from './service/logout-pubsub.service';

export const REDIS_PUBSUB_CLIENT = 'REDIS_PUBSUB_CLIENT';

@Module({
    imports: [ConfigModule, SSEModule],
    providers: [
        {
            provide: REDIS_PUBSUB_CLIENT,
            useFactory: async (config: ConfigService): Promise<RedisClientType> => {
                const host = config.get<string>('REDIS_HOST')
                const port = config.get<number>('REDIS_PORT')
                // const client = createClient({ url: `redis://${host}:${port}` });
                const client = createClient({
                    url: `redis://${host}:${port}`,
                    socket: {
                        reconnectStrategy(retries) {
                            if (retries > 50) return new Error('Redis max reconnect attempts');
                            return Math.min(retries * 100, 3000);
                        },
                    },
                });
                await client.connect();
                return client as RedisClientType;
            },
            inject: [ConfigService],
        },
        LogoutPubSubService,
    ],
    exports: [LogoutPubSubService],
})
export class RedisPubSubModule { }