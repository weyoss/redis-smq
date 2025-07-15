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
  IQueueParams,
  NamespaceNotFoundError,
  QueueQueueHasRunningConsumersError,
  QueueQueueNotEmptyError,
  QueueQueueNotFoundError,
} from '../../../src/index.js';
import {
  createQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getNamespace } from '../../common/namespace.js';
import { getQueueMessages } from '../../common/queue-messages.js';

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

  await expect(ns.deleteAsync('ns1')).rejects.toThrow(QueueQueueNotEmptyError);

  await qm.purgeAsync(queueA);

  await expect(ns.deleteAsync('ns1')).rejects.toThrow(QueueQueueNotEmptyError);

  await qm.purgeAsync(queueB);
  await c1.runAsync();
  await c2.runAsync();

  await expect(ns.deleteAsync('ns1')).rejects.toThrow(
    QueueQueueHasRunningConsumersError,
  );

  await c1.shutdownAsync();

  await expect(ns.deleteAsync('ns1')).rejects.toThrow(
    QueueQueueHasRunningConsumersError,
  );

  await c2.shutdownAsync();
  await ns.deleteAsync('ns1');

  await expect(qm.countMessagesByStatusAsync(queueA)).rejects.toThrow(
    QueueQueueNotFoundError,
  );

  await expect(qm.countMessagesByStatusAsync(queueB)).rejects.toThrow(
    QueueQueueNotFoundError,
  );

  const m5 = await ns.getNamespacesAsync();
  expect(m5).toEqual([]);

  await expect(ns.deleteAsync('ns1')).rejects.toThrow(NamespaceNotFoundError);
});
