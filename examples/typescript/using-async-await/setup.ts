import { config } from './config';
import { setLogger, QueueManager } from '../../..'; // from 'redis-smq'
import { promisifyAll } from 'bluebird';

// Setting up a custom logger
// This step should be also done from your application bootstrap
setLogger(console);

const QueueManagerAsync = promisifyAll(QueueManager);

export async function init(): Promise<void> {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such queue exists
  const queueManager = promisifyAll(
    await QueueManagerAsync.createInstanceAsync(config),
  );

  const queueAsync = promisifyAll(queueManager.queue);

  // Creating a queue (a LIFO queue)
  await queueAsync.createAsync('test_queue', false);
  await queueManager.quitAsync();
}
