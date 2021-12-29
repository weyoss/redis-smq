import { config } from './config';
import { MultiQueueProducer, Message } from '../..'; // from 'redis-smq'

const producer = new MultiQueueProducer(config);

const msg = new Message();
msg.setBody({ hello: 123 });

producer.produce('queue_A', msg, (err) => {
  if (err) throw err;
  else {
    producer.produce('queue_B', msg, (err) => {
      if (err) throw err;
      else {
        console.log(`Successfully produced. Going down...`);
        setTimeout(() => {
          producer.shutdown();
        }, 10000);
      }
    });
  }
});
