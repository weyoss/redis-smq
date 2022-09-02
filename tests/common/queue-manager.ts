import { IConfig, TQueueManager } from '../../types';
import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../src/lib/queue-manager/queue-manager';
import { requiredConfig } from './config';

const QueueManagerAsync = promisifyAll(QueueManager);

let queueManager: TQueueManager | null = null;

export async function getQueueManager(cfg: IConfig = requiredConfig) {
  if (!queueManager) {
    queueManager = await QueueManagerAsync.createInstanceAsync(cfg);
  }
  const queue = promisifyAll(queueManager.queue);
  const namespace = promisifyAll(queueManager.namespace);
  const queueRateLimit = promisifyAll(queueManager.queueRateLimit);
  const queueMetrics = promisifyAll(queueManager.queueMetrics);
  return {
    queue,
    namespace,
    queueRateLimit,
    queueMetrics,
  };
}

export async function shutDownQueueManager() {
  if (queueManager) {
    await promisifyAll(queueManager).quitAsync();
    queueManager = null;
  }
}
