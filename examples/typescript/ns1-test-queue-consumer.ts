import { config } from './config';
import { Consumer, Message } from '../..'; // from 'redis-smq'
import { ICallback } from '../../types'; // from 'redis-smq/dist/types'

class Ns1TestQueueConsumer extends Consumer {
  consume(message: Message, cb: ICallback<void>) {
    //  console.log(`Got message to consume: `, JSON.stringify(message));
    //  throw new Error('TEST!');
    //  cb(new Error('TEST!'));
    //  const timeout = parseInt(Math.random() * 100);
    //  setTimeout(() => {
    //      cb();
    //  }, timeout);
    cb();
  }
}

const consumer = new Ns1TestQueueConsumer('test_queue', config);
consumer.run();
