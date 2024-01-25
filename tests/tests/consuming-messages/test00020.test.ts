/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ProducerMessageExchangeRequiredError,
  ProducibleMessage,
} from '../../../index';
import { getProducer } from '../../common/producer';

test('Producing a message without a message queue', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' });

  await expect(async () => {
    await producer.produceAsync(msg);
  }).rejects.toThrow(ProducerMessageExchangeRequiredError);
});
