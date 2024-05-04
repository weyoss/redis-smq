/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { ExchangeInvalidTopicParamsError } from '../../../../src/lib/exchange/errors/exchange-invalid-topic-params.error.js';
import { getTopicExchange } from '../../../common/exchange.js';

test('ExchangeTopic: topic validation', async () => {
  const e = getTopicExchange();
  await expect(e.getQueuesAsync('!@223333')).rejects.toThrow(
    ExchangeInvalidTopicParamsError,
  );
  await expect(e.getQueuesAsync('223333.')).rejects.toThrow(
    ExchangeInvalidTopicParamsError,
  );
  await expect(e.getQueuesAsync('223333.w')).rejects.toThrow(
    ExchangeInvalidTopicParamsError,
  );
  await expect(e.getQueuesAsync('a223333.w')).resolves.not.toThrow();
  await expect(e.getQueuesAsync('a223333.w_e')).resolves.not.toThrow();
  await expect(e.getQueuesAsync('a223333.w-e')).resolves.not.toThrow();
});
