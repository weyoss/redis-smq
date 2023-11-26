/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { ProducerMessageAlreadyPublishedError } from '../../../src/lib/producer/errors';
import { Message } from '../../../src/lib/message/message';
import { getProducer } from '../../common/producer';

test('Producing duplicate message', async () => {
  await createQueue(defaultQueue, false);
  const m = new Message().setQueue(defaultQueue).setBody('123');
  const p = await getProducer();
  await p.runAsync();
  await p.produceAsync(m);
  await expect(async () => {
    await p.produceAsync(m);
  }).rejects.toThrow(ProducerMessageAlreadyPublishedError);
});
