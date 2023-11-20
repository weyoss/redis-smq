/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../types';
import {
  createQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { getNamespace } from '../../common/namespace';
import { getQueueMessages } from '../../common/queue-messages';
import { QueueNotEmptyError } from '../../../src/lib/queue/errors';
import { QueueHasRunningConsumersError } from '../../../src/lib/queue/errors';
import { QueueNotFoundError } from '../../../src/lib/queue/errors';
import { QueueNamespaceNotFoundError } from '../../../src/lib/queue/errors';

test('Combined: Fetching namespaces, deleting a namespace with its message queues', async () => {
  const queueA: IQueueParams = {
    name: 'queue_a',
    ns: 'ns1',
  };
  await createQueue(queueA, false);
  const { consumer: c1 } = await produceAndAcknowledgeMessage(queueA);

  const queueB: IQueueParams = {
    name: 'queue_b',
    ns: 'ns1',
  };
  await createQueue(queueB, false);
  const { consumer: c2 } = await produceAndAcknowledgeMessage(queueB);

  const ns = await getNamespace();

  const m0 = await ns.getNamespacesAsync();
  expect(m0).toEqual(['ns1']);

  const qm = await getQueueMessages();
  const m1 = await qm.countMessagesByStatusAsync(queueA);
  expect(m1.acknowledged).toBe(1);

  const m2 = await qm.countMessagesByStatusAsync(queueB);
  expect(m2.acknowledged).toBe(1);

  await c1.shutdownAsync();
  await c2.shutdownAsync();

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueNotEmptyError);

  await qm.purgeAsync(queueA);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueNotEmptyError);

  await qm.purgeAsync(queueB);
  await c1.runAsync();
  await c2.runAsync();

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueHasRunningConsumersError);

  await c1.shutdownAsync();

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueHasRunningConsumersError);

  await c2.shutdownAsync();
  await ns.deleteAsync('ns1');

  await expect(qm.countMessagesByStatusAsync(queueA)).rejects.toThrow(
    QueueNotFoundError,
  );

  await expect(qm.countMessagesByStatusAsync(queueB)).rejects.toThrow(
    QueueNotFoundError,
  );

  const m5 = await ns.getNamespacesAsync();
  expect(m5).toEqual([]);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueNamespaceNotFoundError);
});
