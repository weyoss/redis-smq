import { Consumer } from '../../..';
import { promisifyAll } from 'bluebird';

const consumer = promisifyAll(new Consumer());

export async function consume(): Promise<void> {
  // starting the consumer and then registering a message handler
  await consumer.consumeAsync(
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
  );

  // Starting the consumer.
  // The consumer can also be started before registering message handlers (before calling consumer.consumeAsync())
  await consumer.runAsync();
}
