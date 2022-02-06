import { promisifyAll } from 'bluebird';
import { TQueueParams } from '../../../types';
import { DeleteQueueRequestDTO } from '../controllers/api/namespaces/queue/delete-queue/delete-queue.request.DTO';
import { QueueManager } from '../../queue-manager';
import { GetNamespaceQueuesRequestDTO } from '../controllers/api/namespaces/get-namespace-queues/get-namespace-queues.request.DTO';
import { DeleteNamespaceRequestDTO } from '../controllers/api/namespaces/delete-namespace/delete-namespace.request.DTO';

const queueManagerAsync = promisifyAll(QueueManager.prototype);

export class QueuesService {
  protected queueManager: typeof queueManagerAsync;

  constructor(queueManager: QueueManager) {
    this.queueManager = promisifyAll(queueManager);
  }

  async getNamespaces(): Promise<string[]> {
    return this.queueManager.getNamespacesAsync();
  }

  async getNamespaceQueues(
    args: GetNamespaceQueuesRequestDTO,
  ): Promise<TQueueParams[]> {
    const { ns } = args;
    return this.queueManager.getNamespaceQueuesAsync(ns);
  }

  async deleteNamespace(args: DeleteNamespaceRequestDTO): Promise<void> {
    const { ns } = args;
    return this.queueManager.deleteNamespaceAsync(ns);
  }

  async getQueues(): Promise<TQueueParams[]> {
    return this.queueManager.getQueuesAsync();
  }

  async deleteQueue(args: DeleteQueueRequestDTO): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.deleteQueueAsync({
      name: queueName,
      ns,
    });
  }
}
