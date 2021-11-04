import { ICallback } from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';
import { Ticker } from '../../common/ticker';
import { events } from '../../common/events';
import { Handler } from './handler';

export class DequeueHandler extends Handler {
  protected ticker: Ticker;

  constructor(redisClient: RedisClient) {
    super(redisClient);
    // A ticker is needed for pooling priority queues
    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    this.ticker = new Ticker(() => void 0, 1000);
  }

  dequeueWithPriority(
    keyQueuePriority: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.redisClient.zpoprpush(
      keyQueuePriority,
      keyQueueProcessing,
      (err, reply) => {
        if (err) cb(err);
        else if (typeof reply === 'string') cb(null, reply);
        else {
          this.ticker.nextTickFn(() => {
            this.dequeueWithPriority(keyQueuePriority, keyQueueProcessing, cb);
          });
        }
      },
    );
  }

  dequeue(
    keyQueue: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.redisClient.brpoplpush(keyQueue, keyQueueProcessing, 0, cb);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
