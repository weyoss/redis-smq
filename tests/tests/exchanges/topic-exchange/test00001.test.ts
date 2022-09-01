import { TopicExchange } from '../../../../src/lib/exchange/topic.exchange';
import { RedisKeysError } from '../../../../src/common/redis-keys/redis-keys.error';

test('TopicExchange: topic validation', async () => {
  expect(() => new TopicExchange('!@223333')).toThrow(RedisKeysError);
  expect(() => new TopicExchange('223333.')).toThrow(RedisKeysError);
  expect(() => new TopicExchange('223333.w')).toThrow(RedisKeysError);
  expect(() => new TopicExchange('a223333.w')).not.toThrow();
  expect(() => new TopicExchange('a223333.w_e')).not.toThrow();
  expect(() => new TopicExchange('a223333.w-e')).not.toThrow();
});
