import { config } from './config';
import { Producer, Message, setConfiguration } from '../..'; // from 'redis-smq'

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

const producer = new Producer();

const msg = new Message();
msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');

producer.produce(msg, (err) => {
  if (err) throw err;
  else console.log(`Successfully published`);
});
