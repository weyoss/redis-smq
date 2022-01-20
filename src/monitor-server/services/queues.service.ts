import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { PurgePendingMessagesRequestDTO } from '../controllers/api/queues/queue/pending-messages/purge-pending-messages/purge-pending-messages.request.DTO';
import { PurgePendingMessagesWithPriorityRequestDTO } from '../controllers/api/queues/queue/pending-messages-with-priority/purge-pending-messages-with-priority/purge-pending-messages-with-priority.request.DTO';
import { TQueueParams } from '../../../types';
import { DeleteQueueRequestDTO } from '../controllers/api/queues/queue/delete-queue/delete-queue.request.DTO';

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

  async purgePendingQueue(args: PurgePendingMessagesRequestDTO): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgePendingQueueAsync({
      name: queueName,
      ns,
    });
  }

  async purgePriorityQueue(
    args: PurgePendingMessagesWithPriorityRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgePriorityQueueAsync({
      name: queueName,
      ns,
    });
  }
}
