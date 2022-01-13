import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { PurgeAcknowledgedMessagesRequestDTO } from '../controllers/messages/actions/purge-acknowledged-messages/purge-acknowledged-messages-request.DTO';
import { PurgePendingMessagesRequestDTO } from '../controllers/messages/actions/purge-pending-messages/purge-pending-messages-request.DTO';
import { PurgePriorityMessagesRequestDTO } from '../controllers/messages/actions/purge-priority-messages/purge-priority-messages-request.DTO';
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
    args: PurgeAcknowledgedMessagesRequestDTO,
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
    args: PurgePriorityMessagesRequestDTO,
  ): Promise<void> {
    const { ns, queueName } = args;
    return this.queueManager.purgePriorityQueueAsync({
      name: queueName,
      ns,
    });
  }

  async purgeScheduledMessagesQueue(): Promise<void> {
    return this.queueManager.purgeScheduledMessagesAsync();
  }
}
