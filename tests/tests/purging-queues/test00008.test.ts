import { IQueueParams } from '../../../types';
import {
  createQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
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
  const { consumer: c1, queue: q1 } =
    await produceAndAcknowledgeMessage(queueA);

  const queueB: IQueueParams = {
    name: 'queue_b',
    ns: 'ns1',
  };
  await createQueue(queueB, false);
  const { consumer: c2, queue: q2 } =
    await produceAndAcknowledgeMessage(queueB);

  const ns = await getNamespace();

  const m0 = await ns.getNamespacesAsync();
  expect(m0).toEqual(['ns1']);

  const qm = await getQueueMessages();
  const m1 = await qm.countMessagesByStatusAsync(q1);
  expect(m1.acknowledged).toBe(1);

  const m2 = await qm.countMessagesByStatusAsync(q2);
  expect(m2.acknowledged).toBe(1);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueNotEmptyError);

  await qm.purgeAsync(q1);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueHasRunningConsumersError);

  await shutDownBaseInstance(c1);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueNotEmptyError);

  await qm.purgeAsync(q2);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueHasRunningConsumersError);

  await shutDownBaseInstance(c2);
  await ns.deleteAsync('ns1');

  await expect(qm.countMessagesByStatusAsync(q1)).rejects.toThrow(
    QueueNotFoundError,
  );

  await expect(qm.countMessagesByStatusAsync(q2)).rejects.toThrow(
    QueueNotFoundError,
  );

  const m5 = await ns.getNamespacesAsync();
  expect(m5).toEqual([]);

  await expect(async () => {
    await ns.deleteAsync('ns1');
  }).rejects.toThrow(QueueNamespaceNotFoundError);
});
