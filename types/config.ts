import { Monitor } from 'redis-smq-monitor';

export interface ConfigInterface extends Monitor.ConfigInterface {
    namespace?: string,
    log?: {
        enabled: boolean,
        options: {
            [key:string]: any
        }
    },
}