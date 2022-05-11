import {
  createQueue,
  getQueueManager,
  produceAndAcknowledgeMessage,
} from '../common';
import { TQueueParams } from '../../types';

test('Combined: Fetching namespaces, deleting a namespace with its message queues', async () => {
  const queueA: TQueueParams = {
    name: 'queue_a',
    ns: 'ns1',
  };
  await createQueue(queueA, false);
  const { consumer: c1, queue: q1 } = await produceAndAcknowledgeMessage(
    queueA,
  );

  const queueB: TQueueParams = {
    name: 'queue_b',
    ns: 'ns1',
  };
  await createQueue(queueB, false);
  const { consumer: c2, queue: q2 } = await produceAndAcknowledgeMessage(
    queueB,
  );

  const queueManager = await getQueueManager();

  const m0 = await queueManager.namespace.getNamespacesAsync();
  expect(m0).toEqual(['ns1']);

  const m1 = await queueManager.queueMetrics.getQueueMetricsAsync(q1);
  expect(m1.acknowledged).toBe(1);

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(q2);
  expect(m2.acknowledged).toBe(1);

  await expect(async () => {
    await queueManager.namespace.deleteNamespaceAsync('ns1');
  }).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await c1.shutdownAsync();
  await expect(async () => {
    await queueManager.namespace.deleteNamespaceAsync('ns1');
  }).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await c2.shutdownAsync();
  await queueManager.namespace.deleteNamespaceAsync('ns1');

  await expect(
    queueManager.queueMetrics.getQueueMetricsAsync(q1),
  ).rejects.toThrow('Queue does not exist');

  await expect(
    queueManager.queueMetrics.getQueueMetricsAsync(q2),
  ).rejects.toThrow('Queue does not exist');

  const m5 = await queueManager.namespace.getNamespacesAsync();
  expect(m5).toEqual([]);

  await expect(async () => {
    await queueManager.namespace.deleteNamespaceAsync('ns1');
  }).rejects.toThrow(`Namespace (ns1) does not exist`);
});
