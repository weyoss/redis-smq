/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../../src/lib/message/message-envelope';
import { getProducer } from '../../../common/producer';
import { ProducerMessageNotPublishedError } from '../../../../src/lib/producer/errors';
import { ExchangeTopic } from '../../../../src/lib/exchange/exchange-topic';

test('ExchangeTopic: producing message having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const e = new ExchangeTopic('a.b.c.d');
  const msg = new MessageEnvelope().setExchange(e).setBody('hello');

  await expect(async () => await producer.produceAsync(msg)).rejects.toThrow(
    ProducerMessageNotPublishedError,
  );
});
