import { Monitor } from 'redis-smq-monitor';

export interface ConfigInterface extends Monitor.ConfigInterface {
    namespace?: string,
    redis: {
        driver: Monitor.RedisDriver,
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