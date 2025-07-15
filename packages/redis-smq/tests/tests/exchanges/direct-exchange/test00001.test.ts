/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ExchangeInvalidQueueParamsError } from '../../../../src/index.js';
import { getDirectExchange } from '../../../common/exchange.js';

test('DirectExchange', async () => {
  const e = getDirectExchange();
  await expect(e.getQueuesAsync('!@223333')).rejects.toThrow(
    ExchangeInvalidQueueParamsError,
  );
  await expect(e.getQueuesAsync('223333.')).rejects.toThrow(
    ExchangeInvalidQueueParamsError,
  );
  await expect(e.getQueuesAsync('223333.w')).rejects.toThrow(
    ExchangeInvalidQueueParamsError,
  );
  await expect(e.getQueuesAsync('a223333.w')).resolves.not.toThrow();
  await expect(e.getQueuesAsync('a223333.w_e')).resolves.not.toThrow();
  await expect(e.getQueuesAsync('a223333.w-e')).resolves.not.toThrow();
  const r = await e.getQueuesAsync('queue_a');
  expect(r).toEqual([{ name: 'queue_a', ns: 'testing' }]);
});
