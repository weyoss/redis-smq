import { Monitor } from 'redis-smq-monitor';

export enum ConfigRedisDriver {
    REDIS = "redis",
    IOREDIS = "ioredis"
}

export interface ConfigInterface extends Monitor.ConfigInterface {
    namespace?: string,
    redis: {
        driver: ConfigRedisDriver,
        options: {
            [key:string]: any
        }
    },
    log?: {
        enabled: boolean,
        options: {
            [key:string]: any
        }
    },
}