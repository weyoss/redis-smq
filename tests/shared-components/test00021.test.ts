import { getRedisInstance, mockConfiguration } from '../common';
import { RedisClientName } from '../../types';
import { delay } from 'bluebird';

test("RedisClient: create/terminate an instance that uses 'redis' client", async () => {
  mockConfiguration({
    redis: {
      client: RedisClientName.REDIS,
    },
  });
  const client = await getRedisInstance();
  await client.quitAsync();

  // should not return an error
  await client.quitAsync();

  const client2 = await getRedisInstance();
  await client2.end(true);
  await delay(3000);

  // should not return an error
  await client2.end(true);
});
