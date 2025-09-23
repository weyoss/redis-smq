import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { RedisConnectionPool } from './redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from './types/index.js';

export function withExclusivePoolConnection<T>(
  operation: (client: IRedisClient, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  const connectionPool = RedisConnectionPool.getInstance();
  async.withCallback(
    (cb) =>
      connectionPool.acquire(ERedisConnectionAcquisitionMode.EXCLUSIVE, cb),
    operation,
    callback,
  );
}
