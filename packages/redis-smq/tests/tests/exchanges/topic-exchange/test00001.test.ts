/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, test } from 'vitest';
import { getTopicExchange } from '../../../common/exchange.js';
import { InvalidTopicExchangeParamsError } from '../../../../src/errors/index.js';

describe('ExchangeTopic: topic validation', () => {
  test('rejects on malformed topic structure', async () => {
    const e = getTopicExchange();
    const invalidTopics = ['f0)', '[', '*', '+++'];
    for (const t of invalidTopics) {
      await expect(e.getQueuesAsync(t)).rejects.toBeInstanceOf(
        InvalidTopicExchangeParamsError,
      );
    }
  });

  test('accepts valid topic formats', async () => {
    const e = getTopicExchange();
    // Conservative set of valid topics: alphanumerics with separators and safe symbols
    const validTopics = [
      'a',
      'order',
      'order.created',
      'user.update.email',
      'alpha.beta.gamma',
      'foo_bar',
      'foo-bar',
      'foo_bar-123',
      'A.B',
      'x1.y2.z3',
    ];

    for (const t of validTopics) {
      await expect(e.getQueuesAsync(t)).resolves.not.toBeInstanceOf(Error);
    }
  });
});
