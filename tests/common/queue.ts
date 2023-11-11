import { promisifyAll } from 'bluebird';
import { Queue } from '../../src/lib/queue/queue/queue';

export async function getQueue() {
  return promisifyAll(new Queue());
}
