import { config } from './config';
import { Producer, Message } from '../..'; // from 'redis-smq'

const producer = new Producer('test_queue', config);

const msg = new Message();
msg.setBody({ ts: `Current time is ${Date.now()}` });

producer.produce(msg, (err) => {
  if (err) throw err;
  else {
    console.log(`Successfully produced. Going down...`);
    producer.shutdown();
  }
});
