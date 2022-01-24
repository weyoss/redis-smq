import { ICallback, TQueueParams } from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { Ticker } from '../../common/ticker/ticker';
import { events } from '../../common/events';
import { Handler } from './handler';
import { redisKeys } from '../../common/redis-keys/redis-keys';

export class DequeueHandler extends Handler {
  protected ticker: Ticker;
  protected keyQueue: string;
  protected keyQueuePriority: string;
  protected keyPendingMessagesWithPriority: string;
  protected keyQueueProcessing: string;
  protected usingPriorityQueuing: boolean;

  constructor(
    redisClient: RedisClient,
    queue: TQueueParams,
    keyQueueProcessing: string,
    usePriorityQueuing: boolean,
  ) {
    super(redisClient);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePending,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    this.keyQueue = keyQueuePending;
    this.keyPendingMessagesWithPriority = keyQueuePendingPriorityMessages;
    this.keyQueuePriority = keyQueuePendingPriorityMessageIds;
    this.keyQueueProcessing = keyQueueProcessing;
    this.usingPriorityQueuing = usePriorityQueuing;

    // A ticker is needed for pooling priority queues
    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    this.ticker = new Ticker(() => void 0, 1000);
  }

  protected dequeueWithPriority(cb: ICallback<string>): void {
    this.redisClient.zpophgetrpush(
      this.keyQueuePriority,
      this.keyPendingMessagesWithPriority,
      this.keyQueueProcessing,
      (err, reply) => {
        if (err) {
          this.ticker.abort();
          cb(err);
        } else if (typeof reply === 'string') {
          cb(null, reply);
        } else {
          this.ticker.nextTickFn(() => {
            this.dequeueWithPriority(cb);
          });
        }
      },
    );
  }

  protected dequeue(cb: ICallback<string>): void {
    this.redisClient.brpoplpush(
      this.keyQueue,
      this.keyQueueProcessing,
      0,
      (err, reply) => {
        if (err) {
          this.ticker.abort();
          cb(err);
        } else cb(null, reply);
      },
    );
  }

  dequeueMessage(cb: ICallback<string>): void {
    if (this.usingPriorityQueuing) this.dequeueWithPriority(cb);
    else this.dequeue(cb);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
