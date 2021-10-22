import { ICallback } from '../../../../types';
import { RedisClient } from '../../redis-client';
import { ELuaScriptName, getScriptId } from '../lua-scripts';
import { Ticker } from '../../ticker';
import { events } from '../../events';

export class DequeueMessageHandler {
  protected ticker: Ticker;

  constructor() {
    // A ticker is needed for pooling priority queues
    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    this.ticker = new Ticker(() => void 0, 1000);
  }

  dequeueWithPriority(
    redisClient: RedisClient,
    keyQueuePriority: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    redisClient.evalsha(
      getScriptId(ELuaScriptName.DEQUEUE_MESSAGE_WITH_PRIORITY),
      [2, keyQueuePriority, keyQueueProcessing],
      (err, json) => {
        if (err) cb(err);
        else if (typeof json === 'string') cb(null, json);
        else
          this.ticker.nextTickFn(() =>
            this.dequeueWithPriority(
              redisClient,
              keyQueuePriority,
              keyQueueProcessing,
              cb,
            ),
          );
      },
    );
  }

  dequeue(
    redisClient: RedisClient,
    keyQueue: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    redisClient.brpoplpush(keyQueue, keyQueueProcessing, 0, cb);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
