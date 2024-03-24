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
  ProducerMessageExchangeRequiredError,
  ProducibleMessage,
} from '../../../index.js';
import { getProducer } from '../../common/producer.js';

test('Producing a message without a message queue', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' });

  await expect(producer.produceAsync(msg)).rejects.toThrow(
    ProducerMessageExchangeRequiredError,
  );
});
