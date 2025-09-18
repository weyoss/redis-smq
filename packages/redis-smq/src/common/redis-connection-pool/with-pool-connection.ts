import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { RedisConnectionPool } from './redis-connection-pool.js';

export function withPoolConnection<T>(
  operation: (client: IRedisClient, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  const connectionPool = RedisConnectionPool.getInstance();
  async.withCallback(
    (cb) => connectionPool.acquire(cb),
    (redisClient: IRedisClient, cb: ICallback<T>) => {
      operation(redisClient, (err, result) => {
        connectionPool.release(redisClient);
        cb(err, result);
      });
    },
    callback,
  );
}
