import {ConfigInterface} from "../../types/config";
import { Monitor } from "redis-smq-monitor";

export const config: ConfigInterface = {
    namespace: 'ns1',
    redis: {
        //
        driver: Monitor.RedisDriver.IOREDIS,
        options: {
            host: '127.0.0.1',
            port: 6379,
        },
    },
    log: {
        enabled: true,
        options: {
            level: 'trace',
            /*
            streams: [
                {
                    path: path.normalize(`${__dirname}/logs/redis-smq.log`)
                },
            ],
            */
        },
    },
    monitor: {
        enabled: true,
        port: 3000,
        host: '127.0.0.1',
    },
};
