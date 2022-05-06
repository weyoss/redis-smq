import { Consumer } from '../../..';
import { ICallback } from '../../../types'; // from 'redis-smq'

const consumer = new Consumer();

export function consume(cb: ICallback<void>): void {
  consumer.consume(
    // Using the default namespace from the config
    // Same as { name: 'test_queue', ns: 'ns1' })
    'test_queue',
    (message, cb) => {
      /* eslint class-methods-use-this: 0 */
      //  console.log(`Got message to consume: `, JSON.stringify(message));
      //  throw new Error('TEST!');
      //  cb(new Error('TEST!'));
      //  const timeout = parseInt(Math.random() * 100);
      //  setTimeout(() => {
      //      cb();
      //  }, timeout);
      cb();
    },
    (err, isRunning) => {
      if (err) console.log(err);
      else {
        // As the consumer is not running, the message handler does not run immediately
        // At this time the message handler is just registered
        console.log(`Is running? ${isRunning}`); // false
      }
    },
  );

  consumer.run((err) => {
    if (err) cb(err);
    else {
      consumer.consume(
        'another_queue',
        (message, cb) => {
          cb();
        },
        (err, isRunning) => {
          if (err) cb(err);
          else {
            // At this time the message handler is expected to be running
            console.log(`Is running? ${isRunning}`); // true
            cb();
          }
        },
      );
    }
  });
}
