import { promisifyAll } from 'bluebird';
import { QueuePendingMessages } from '../../src/lib/queue/queue-pending-messages';

export async function getQueuePendingMessages() {
  return promisifyAll(new QueuePendingMessages());
}
