import { ICallback } from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';
import { Ticker } from '../../common/ticker';
import { events } from '../../common/events';
import { Handler } from './handler';
import { redisKeys } from '../../common/redis-keys';

export class DequeueHandler extends Handler {
  protected ticker: Ticker;
  protected keyQueue: string;
  protected keyQueuePriority: string;
  protected keyPendingMessagesWithPriority: string;
  protected keyQueueProcessing: string;

  constructor(
    redisClient: RedisClient,
    queueName: string,
    keyQueueProcessing: string,
  ) {
    super(redisClient);
    const { keyQueuePriority, keyQueue, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queueName);
    this.keyQueue = keyQueue;
    this.keyPendingMessagesWithPriority = keyPendingMessagesWithPriority;
    this.keyQueuePriority = keyQueuePriority;
    this.keyQueueProcessing = keyQueueProcessing;

    // A ticker is needed for pooling priority queues
    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    this.ticker = new Ticker(() => void 0, 1000);
  }

  dequeueWithPriority(cb: ICallback<string>): void {
    this.redisClient.zpophgetrpush(
      this.keyQueuePriority,
      this.keyPendingMessagesWithPriority,
      this.keyQueueProcessing,
      (err, reply) => {
        if (err) cb(err);
        else if (typeof reply === 'string') cb(null, reply);
        else {
          this.ticker.nextTickFn(() => {
            this.dequeueWithPriority(cb);
          });
        }
      },
    );
  }

  dequeue(cb: ICallback<string>): void {
    this.redisClient.brpoplpush(this.keyQueue, this.keyQueueProcessing, 0, cb);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
