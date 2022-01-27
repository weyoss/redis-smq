import { Ticker } from '../common/ticker/ticker';
import { RedisClient } from '../common/redis-client/redis-client';
import { ICallback } from '../../../types';
import { events } from '../common/events';

export abstract class ConsumerWorker {
  protected ticker: Ticker;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.ticker = new Ticker(this.onTick, 1000);
  }

  protected onTick = (): void => {
    this.work((err) => {
      if (err) throw err;
      this.ticker.nextTick();
    });
  };

  run = (): void => {
    if (this.ticker.isDown()) {
      this.ticker.nextTick();
    }
  };

  quit = (cb: ICallback<void>): void => {
    if (this.ticker.isRunning()) {
      this.ticker.on(events.DOWN, cb);
      this.ticker.quit();
    } else cb();
  };

  abstract work(cb: ICallback<void>): void;
}
