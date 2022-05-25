import { Producer, Message } from '../../..';
import { ICallback } from 'redis-smq-common/dist/types';
import { config } from './config';

const producer = new Producer(config);

export function produce(cb: ICallback<void>): void {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  producer.produce(msg, cb);
}
