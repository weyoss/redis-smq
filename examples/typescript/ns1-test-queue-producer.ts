import { config } from './config';
import { Producer, Message } from '../..'; // from 'redis-smq'

const producer = new Producer('test_queue', config);

const msg = new Message();
msg.setBody({ hello: 123 });

producer.produceMessage(msg, (err) => {
  if (err) throw err;
  else {
    console.log(`Successfully produced. Going down...`);
    producer.shutdown();
  }
});
