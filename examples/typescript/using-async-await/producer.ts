import { Producer, Message } from '../../..'; // from 'redis-smq'
import { promisifyAll } from 'bluebird';

const producer = promisifyAll(new Producer());

export async function produce(): Promise<void> {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  await producer.produceAsync(msg);
}
