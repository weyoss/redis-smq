import { RedisKeysError } from '../../../../src/common/redis-keys/redis-keys.error';
import { DirectExchange } from '../../../../src/lib/exchange/direct.exchange';
import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../../../common/redis';
import { requiredConfig } from '../../../common/config';

test('DirectExchange', async () => {
  expect(() => new DirectExchange('!@223333')).toThrow(RedisKeysError);
  expect(() => new DirectExchange('223333.')).toThrow(RedisKeysError);
  expect(() => new DirectExchange('223333.w')).toThrow(RedisKeysError);
  expect(() => new DirectExchange('a223333.w')).not.toThrow(RedisKeysError);
  expect(() => new DirectExchange('a223333.w_e')).not.toThrow();
  expect(() => new DirectExchange('a223333.w-e')).not.toThrow();
  const e = promisifyAll(new DirectExchange('queue_a'));
  const client = await getRedisInstance();
  const r = await e.getQueuesAsync(client, requiredConfig);
  expect(r).toEqual([{ name: 'queue_a', ns: 'testing' }]);
});
