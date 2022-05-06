import { Producer, Message } from '../../..'; // from 'redis-smq'
import { ICallback } from '../../../types';

const producer = new Producer();

export function produce(cb: ICallback<void>): void {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');

  producer.produce(msg, (err) => {
    if (err) cb(err);
    else {
      console.log(`Successfully published`);

      // Publishing another message
      const anotherMsg = new Message();
      anotherMsg
        .setBody({ ts: `Current time is ${Date.now()}` })

        // another_queue is a priority queue which has been created previously
        .setQueue('another_queue')

        // Message priority needs to set as we are publish a message to a priority queue
        // Otherwise the message will not be published and an error will be returned
        .setPriority(Message.MessagePriority.HIGH);
      producer.produce(anotherMsg, cb);
    }
  });
}
