import { promisifyAll } from 'bluebird';
import { QueueRateLimit } from '../../src/lib/queue/queue-rate-limit';

export async function getQueueRateLimit() {
  return promisifyAll(new QueueRateLimit());
}
