import { promisifyAll } from 'bluebird';
import { QueueScheduledMessages } from '../../src/lib/queue/queue-scheduled-messages';

export async function getQueueScheduledMessages() {
  return promisifyAll(new QueueScheduledMessages());
}
