import { Producer, Message } from '../../..'; // from 'redis-smq'
import { promisifyAll } from 'bluebird';
import { config } from './config';

const producer = promisifyAll(new Producer(config));

export async function produce(): Promise<void> {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  await producer.produceAsync(msg);
}
