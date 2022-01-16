import { config } from './config';
import { MultiQueueProducer, Message } from '../..'; // from 'redis-smq'

const producer = new MultiQueueProducer(config);

const msg = new Message();
msg.setBody({ ts: `Current time is ${Date.now()}` });

producer.produce('queue_A', msg, (err) => {
  if (err) throw err;
  else console.log(`Successfully published`);
});

producer.produce('queue_B', msg, (err) => {
  if (err) throw err;
  else console.log(`Successfully published`);
});
