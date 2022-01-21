import { config } from './config';
import { Producer, Message } from '../..'; // from 'redis-smq'

const producer = new Producer(config);

const msg = new Message();
msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');

producer.produce(msg, (err) => {
  if (err) throw err;
  else console.log(`Successfully published`);
});
