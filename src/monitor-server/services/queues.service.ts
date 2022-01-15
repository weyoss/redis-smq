import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { PurgeAcknowledgedMessagesRequestDTO } from '../controllers/api/queues/queue/acknowledged-messages/purge-acknowledged-messages/purge-acknowledged-messages.request.DTO';
import { PurgePendingMessagesRequestDTO } from '../controllers/api/queues/queue/pending-messages/purge-pending-messages/purge-pending-messages.request.DTO';
import { PurgePendingMessagesWithPriorityRequestDTO } from '../controllers/api/queues/queue/pending-messages-with-priority/purge-pending-messages-with-priority/purge-pending-messages-with-priority.request.DTO';
import { PurgeDeadLetteredMessagesRequestDTO } from '../controllers/api/queues/queue/dead-lettered-messages/purge-dead-lettered-messages/purge-dead-lettered-messages.request.DTO';
import { TQueueParams } from '../../../types';

const queueManagerAsync = promisifyAll(QueueManager.prototype);

export class QueuesService {
  protected queueManager: typeof queueManagerAsync;

  constructor(queueManager: QueueManager) {
    this.queueManager = promisifyAll(queueManager);
  }

  async getQueues(): Promise<TQueueParams[]> {
    return this.queueManager.getMessageQueuesAsync();
  }

  async purgeAcknowledgedQueue(
    args: PurgeAcknowledgedMessagesRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgeAcknowledgedQueueAsync({
      name: queueName,
      ns,
    });
  }

  async purgeDeadLetterQueue(
    args: PurgeDeadLetteredMessagesRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgeDeadLetteredQueueAsync({
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

  async purgeScheduledQueue(): Promise<void> {
    return this.queueManager.purgeScheduledQueueAsync();
  }
}
