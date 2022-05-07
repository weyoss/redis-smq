import { config } from './config';
import { setLogger, setConfiguration, QueueManager } from '../../..'; // from 'redis-smq'
import { promisifyAll } from 'bluebird';

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

// Setting up a custom logger
// This step should be also done from your application bootstrap
setLogger(console);

const QueueManagerAsync = promisifyAll(QueueManager);

export async function init(): Promise<void> {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such queue exists
  // We are going to create all the queues needed for this example using the QueueManager
  const queueManager = promisifyAll(
    await QueueManagerAsync.getSingletonInstanceAsync(),
  );

  // Creating a normal queue (a LIFO queue)
  await queueManager.createQueueAsync('test_queue', false);

  // Creating a priority queue
  await queueManager.createQueueAsync('another_queue', true);
}