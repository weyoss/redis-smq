import { promisifyAll } from 'bluebird';
import { QueueMessages } from '../../src/lib/queue/queue-messages/queue-messages';

export async function getQueueMessages() {
  return promisifyAll(new QueueMessages());
}
