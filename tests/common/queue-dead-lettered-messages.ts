import { promisifyAll } from 'bluebird';
import { QueueDeadLetteredMessages } from '../../src/lib/queue/queue-dead-lettered-messages';

export async function getQueueDeadLetteredMessages() {
  return promisifyAll(new QueueDeadLetteredMessages());
}
