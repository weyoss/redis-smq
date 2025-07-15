/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  ProducerExchangeNoMatchedQueueError,
  ProducibleMessage,
} from '../../../../src/index.js';
import { getProducer } from '../../../common/producer.js';

test('ExchangeTopic: producing message having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage().setTopic('a.b.c.d').setBody('hello');

  await expect(producer.produceAsync(msg)).rejects.toThrow(
    ProducerExchangeNoMatchedQueueError,
  );
});
