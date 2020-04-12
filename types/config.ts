export enum ConfigRedisDriver {
    REDIS = "redis",
    IOREDIS = "ioredis"
}

export interface ConfigInterface {
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
    monitor?: {
        enabled: boolean,
        port: number,
        host: string,
    }
}