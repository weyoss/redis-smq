/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisKeysError } from '../../../../src/common/redis-keys/redis-keys.error';
import { ExchangeDirect } from '../../../../src/lib/exchange/exchange-direct';
import { promisifyAll } from 'bluebird';

test('DirectExchange', async () => {
  expect(() => new ExchangeDirect('!@223333')).toThrow(RedisKeysError);
  expect(() => new ExchangeDirect('223333.')).toThrow(RedisKeysError);
  expect(() => new ExchangeDirect('223333.w')).toThrow(RedisKeysError);
  expect(() => new ExchangeDirect('a223333.w')).not.toThrow(RedisKeysError);
  expect(() => new ExchangeDirect('a223333.w_e')).not.toThrow();
  expect(() => new ExchangeDirect('a223333.w-e')).not.toThrow();
  const e = promisifyAll(new ExchangeDirect('queue_a'));
  const r = await e.getQueuesAsync();
  expect(r).toEqual([{ name: 'queue_a', ns: 'testing' }]);
});
