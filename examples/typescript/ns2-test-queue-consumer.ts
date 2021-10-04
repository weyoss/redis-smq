import { config } from './config';
import { Consumer, Message } from '../..'; // from 'redis-smq'
import { ICallback } from '../../types'; // from 'redis-smq/dist/types'

class Ns2TestQueueConsumer extends Consumer {
  consume(message: Message, cb: ICallback<void>) {
    cb();
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  expired(_message: any) {}
}

const newConfig = { ...config, namespace: 'ns2' };
const consumer = new Ns2TestQueueConsumer('test_queue', newConfig, {
  messageConsumeTimeout: 2000,
});
consumer.run();
