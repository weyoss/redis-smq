import { config } from './config';
import { QueueManager } from '../../..'; // from 'redis-smq'
import { ICallback } from 'redis-smq-common/dist/types';
import { logger } from 'redis-smq-common';

// Setting up a custom logger
// This step should be also done from your application bootstrap
logger.setLogger(console);

export function init(cb: ICallback<void>): void {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such queue exists
  QueueManager.createInstance(config, (err, queueManager) => {
    if (err) cb(err);
    else if (!queueManager)
      cb(new Error('Expected an instance of QueueManager'));
    else
      queueManager.queue.create('test_queue', false, (err) => {
        if (err) cb(err);
        else queueManager.quit(cb);
      });
  });
}
