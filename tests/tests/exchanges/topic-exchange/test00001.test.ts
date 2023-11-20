/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ExchangeTopic } from '../../../../src/lib/exchange/exchange-topic';
import { RedisKeysError } from '../../../../src/common/redis-keys/redis-keys.error';

test('ExchangeTopic: topic validation', async () => {
  expect(() => new ExchangeTopic('!@223333')).toThrow(RedisKeysError);
  expect(() => new ExchangeTopic('223333.')).toThrow(RedisKeysError);
  expect(() => new ExchangeTopic('223333.w')).toThrow(RedisKeysError);
  expect(() => new ExchangeTopic('a223333.w')).not.toThrow();
  expect(() => new ExchangeTopic('a223333.w_e')).not.toThrow();
  expect(() => new ExchangeTopic('a223333.w-e')).not.toThrow();
});
