import { promisifyAll } from 'bluebird';
import { QueueAcknowledgedMessages } from '../../src/lib/queue/queue-acknowledged-messages';

export async function getQueueAcknowledgedMessages() {
  return promisifyAll(new QueueAcknowledgedMessages());
}
