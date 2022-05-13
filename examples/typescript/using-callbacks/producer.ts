import { Producer, Message } from '../../..'; // from 'redis-smq'
import { ICallback } from '../../../types';

const producer = new Producer();

export function produce(cb: ICallback<void>): void {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  producer.produce(msg, cb);
}
