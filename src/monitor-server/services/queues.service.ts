import { promisifyAll } from 'bluebird';
import { TQueueParams } from '../../../types';
import { DeleteQueueRequestDTO } from '../controllers/api/namespaces/queue/delete-queue/delete-queue.request.DTO';
import { QueueManager } from '../../queue-manager';
import { GetNamespaceQueuesRequestDTO } from '../controllers/api/namespaces/get-namespace-queues/get-namespace-queues.request.DTO';
import { DeleteNamespaceRequestDTO } from '../controllers/api/namespaces/delete-namespace/delete-namespace.request.DTO';
import { SetRateLimitRequestDTO } from '../controllers/api/namespaces/queue/rate-limiting/set-rate-limit/set-rate-limit.request.DTO';
import { ClearRateLimitRequestDTO } from '../controllers/api/namespaces/queue/rate-limiting/clear-rate-limit/clear-rate-limit.request.DTO';
import { GetRateLimitRequestDTO } from '../controllers/api/namespaces/queue/rate-limiting/get-rate-limit/get-rate-limit.request.DTO';

export class QueuesService {
  protected queue;
  protected namespace;
  protected queueRateLimit;

  constructor(queueManager: QueueManager) {
    this.queue = promisifyAll(queueManager.queue);
    this.namespace = promisifyAll(queueManager.namespace);
    this.queueRateLimit = promisifyAll(queueManager.queueRateLimit);
  }

  async getNamespaces(): Promise<string[]> {
    return this.namespace.listAsync();
  }

  async getNamespaceQueues(
    args: GetNamespaceQueuesRequestDTO,
  ): Promise<TQueueParams[]> {
    const { ns } = args;
    return this.namespace.getQueuesAsync(ns);
  }

  async deleteNamespace(args: DeleteNamespaceRequestDTO): Promise<void> {
    const { ns } = args;
    return this.namespace.deleteAsync(ns);
  }

  async getQueues(): Promise<TQueueParams[]> {
    return this.queue.listAsync();
  }

  async deleteQueue(args: DeleteQueueRequestDTO): Promise<void> {
    const { ns, queueName } = args;
    return this.queue.deleteAsync({
      name: queueName,
      ns,
    });
  }

  async setQueueRateLimit(args: SetRateLimitRequestDTO) {
    const { ns, queueName, interval, limit } = args;
    return this.queueRateLimit.setAsync(
      { name: queueName, ns },
      { interval, limit },
    );
  }

  async clearQueueRateLimit(args: ClearRateLimitRequestDTO) {
    const { ns, queueName } = args;
    return this.queueRateLimit.clearAsync({
      name: queueName,
      ns,
    });
  }

  async getQueueRateLimit(args: GetRateLimitRequestDTO) {
    const { ns, queueName } = args;
    return this.queueRateLimit.getAsync({ name: queueName, ns });
  }
}
