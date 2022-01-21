import { config } from './config';
import { Consumer, Message } from '../..'; // from 'redis-smq'
import { ICallback } from '../../types'; // from 'redis-smq/dist/types'

const consumer = new Consumer(config);

consumer.consume(
  'test_queue',
  false,
  (msg: Message, cb: ICallback<void>) => {
    cb();
  },
  (err, isRunning) => {
    if (err) console.log(err);
    else {
      console.log(`Message handler has been added successfully`);
      if (!isRunning)
        console.log('Run your consumer to start consuming messages.');
      else console.log('Consuming messages...');
    }
  },
);

consumer.run();
