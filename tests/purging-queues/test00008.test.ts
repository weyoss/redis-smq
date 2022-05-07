import { getQueueManager, produceAndAcknowledgeMessage } from '../common';
import { promisifyAll } from 'bluebird';

test('Combined: Fetching namespaces, deleting a namespace with its message queues', async () => {
  const ns = 'ns1';
  const { consumer: c1, queue: q1 } = await produceAndAcknowledgeMessage({
    ns,
    name: 'queue_a',
  });

  const { consumer: c2, queue: q2 } = await produceAndAcknowledgeMessage({
    ns,
    name: 'queue_b',
  });

  const queueManager = promisifyAll(await getQueueManager());

  const m0 = await queueManager.getNamespacesAsync();
  expect(m0).toEqual([ns]);

  const m1 = await queueManager.getQueueMetricsAsync(q1);
  expect(m1.acknowledged).toBe(1);

  const m2 = await queueManager.getQueueMetricsAsync(q2);
  expect(m2.acknowledged).toBe(1);

  await expect(async () => {
    await queueManager.deleteNamespaceAsync(ns);
  }).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await c1.shutdownAsync();
  await expect(async () => {
    await queueManager.deleteNamespaceAsync(ns);
  }).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await c2.shutdownAsync();
  await queueManager.deleteNamespaceAsync(ns);

  const m3 = await queueManager.getQueueMetricsAsync(q1);
  expect(m3.acknowledged).toBe(0);

  const m4 = await queueManager.getQueueMetricsAsync(q2);
  expect(m4.acknowledged).toBe(0);

  const m5 = await queueManager.getNamespacesAsync();
  expect(m5).toEqual([]);

  await expect(async () => {
    await queueManager.deleteNamespaceAsync(ns);
  }).rejects.toThrow(`Namespace (${ns}) does not exist`);
});
