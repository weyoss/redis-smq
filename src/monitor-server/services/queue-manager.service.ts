import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { PurgeAcknowledgedMessagesRequestDTO } from '../controllers/messages/actions/purge-acknowledged-messages/purge-acknowledged-messages-request.DTO';
import { PurgePendingMessagesRequestDTO } from '../controllers/messages/actions/purge-pending-messages/purge-pending-messages-request.DTO';
import { PurgePriorityMessagesRequestDTO } from '../controllers/messages/actions/purge-priority-messages/purge-priority-messages-request.DTO';

const queueManagerAsync = promisifyAll(QueueManager.prototype);

export class QueueManagerService {
  protected queueManager: typeof queueManagerAsync;

  constructor(queueManager: QueueManager) {
    this.queueManager = promisifyAll(queueManager);
  }

  async getQueues(): Promise<string[]> {
    return this.queueManager.getMessageQueuesAsync();
  }

  async purgeAcknowledgedQueue(
    args: PurgeAcknowledgedMessagesRequestDTO,
  ): Promise<void> {
    const { queueName } = args;
    return this.queueManager.purgeAcknowledgedMessagesQueueAsync(queueName);
  }

  async purgeDeadLetterQueue(
    args: PurgeAcknowledgedMessagesRequestDTO,
  ): Promise<void> {
    const { queueName } = args;
    return this.queueManager.purgeAcknowledgedMessagesQueueAsync(queueName);
  }

  async purgePendingQueue(args: PurgePendingMessagesRequestDTO): Promise<void> {
    const { queueName } = args;
    return this.queueManager.purgeQueueAsync(queueName);
  }

  async purgePriorityQueue(
    args: PurgePriorityMessagesRequestDTO,
  ): Promise<void> {
    const { queueName } = args;
    return this.queueManager.purgePriorityQueueAsync(queueName);
  }

  async purgeScheduledMessagesQueue(): Promise<void> {
    return this.queueManager.purgeScheduledMessagesQueueAsync();
  }
}
