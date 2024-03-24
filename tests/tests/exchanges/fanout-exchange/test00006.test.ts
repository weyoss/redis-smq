/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import {
  ProducerMessageNotPublishedError,
  ProducibleMessage,
} from '../../../../src/lib/index.js';
import { getProducer } from '../../../common/producer.js';

test('ExchangeFanOut: producing message having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage().setFanOut('fanout_a').setBody('hello');

  await expect(producer.produceAsync(msg)).rejects.toThrow(
    ProducerMessageNotPublishedError,
  );
});
