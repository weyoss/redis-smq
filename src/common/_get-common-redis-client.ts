import {
  redis,
  RedisClient,
  ICallback,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import { Configuration } from '../config/configuration';

let redisClient: RedisClient | null = null;

export function _getCommonRedisClient(cb: ICallback<RedisClient>): void {
  if (!redisClient) {
    const cfg = Configuration.getSetConfig().redis;
    redis.createInstance(cfg, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        redisClient = client;
        cb(null, client);
      }
    });
  } else cb(null, redisClient);
}

export function _destroyCommonRedisClient(cb: ICallback<void>): void {
  if (redisClient) {
    redisClient.halt(() => {
      redisClient = null;
      cb();
    });
  } else cb();
}
