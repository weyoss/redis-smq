import { config } from './config';
import { setLogger, setConfiguration, QueueManager } from '../../..'; // from 'redis-smq'
import { ICallback } from '../../../types';

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

// Setting up a custom logger
// This step should be also done from your application bootstrap
setLogger(console);

export function init(cb: ICallback<void>): void {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such exists
  // We are going to create all the queues needed for this example
  QueueManager.getSingletonInstance((err, queueManager) => {
    if (err) throw err;
    else if (!queueManager)
      throw new Error('Expected an instance of QueueManager');
    else queueManager.queue.create('test_queue', false, cb);
  });
}
