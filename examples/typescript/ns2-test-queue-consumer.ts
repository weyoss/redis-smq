import { config } from './config';
import { Consumer, Message } from '../..'; // from 'redis-smq'
import { TCallback } from '../../types'; // from 'redis-smq/dist/types'

class Ns2TestQueueConsumer extends Consumer {
  consume(message: Message, cb: TCallback<void>) {
    cb();
  }
}

const newConfig = { ...config, namespace: 'ns2' };
const consumer = new Ns2TestQueueConsumer('test_queue', newConfig, {
  messageConsumeTimeout: 2000,
});
consumer.run();
