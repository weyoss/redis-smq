import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { PurgeAcknowledgedMessagesRequestDTO } from '../controllers/messages/actions/purge-acknowledged-messages/purge-acknowledged-messages-request.DTO';
import { PurgePendingMessagesRequestDTO } from '../controllers/messages/actions/purge-pending-messages/purge-pending-messages-request.DTO';
import { PurgePriorityMessagesRequestDTO } from '../controllers/messages/actions/purge-priority-messages/purge-priority-messages-request.DTO';
import { TMessageQueue } from '../../../types';

const queueManagerAsync = promisifyAll(QueueManager.prototype);

export class QueueManagerService {
  protected queueManager: typeof queueManagerAsync;

  constructor(queueManager: QueueManager) {
    this.queueManager = promisifyAll(queueManager);
  }

  async getQueues(): Promise<TMessageQueue[]> {
    return this.queueManager.getMessageQueuesAsync();
  }

  async purgeAcknowledgedQueue(
    args: PurgeAcknowledgedMessagesRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgeAcknowledgedMessagesQueueAsync(ns, queueName);
  }

  async purgeDeadLetterQueue(
    args: PurgeAcknowledgedMessagesRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgeDeadLetterQueueAsync(ns, queueName);
  }

  async purgePendingQueue(args: PurgePendingMessagesRequestDTO): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgeQueueAsync(ns, queueName);
  }

  async purgePriorityQueue(
    args: PurgePriorityMessagesRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgePriorityQueueAsync(ns, queueName);
  }

  async purgeScheduledMessagesQueue(): Promise<void> {
    return this.queueManager.purgeScheduledMessagesQueueAsync();
  }
}
