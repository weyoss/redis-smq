import { promisifyAll } from 'bluebird';
import { TQueueParams } from '../../../types';
import { DeleteQueueRequestDTO } from '../controllers/api/queues/queue/delete-queue/delete-queue.request.DTO';
import { QueueManager } from '../../queue-manager';

const queueManagerAsync = promisifyAll(QueueManager.prototype);

export class QueuesService {
  protected queueManager: typeof queueManagerAsync;

  constructor(queueManager: QueueManager) {
    this.queueManager = promisifyAll(queueManager);
  }

  async getQueues(): Promise<TQueueParams[]> {
    return this.queueManager.getMessageQueuesAsync();
  }

  async deleteQueue(args: DeleteQueueRequestDTO): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.deleteMessageQueueAsync({
      name: queueName,
      ns,
    });
  }
}
