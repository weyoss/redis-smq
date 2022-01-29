import { Ticker } from './ticker/ticker';
import { RedisClient } from './redis-client/redis-client';
import { ICallback, TWorkerParameters } from '../../../types';
import { events } from './events';

export abstract class Worker<T extends TWorkerParameters = TWorkerParameters> {
  private ticker: Ticker;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, params: T) {
    this.redisClient = redisClient;
    const { timeout = 1000 } = params;
    this.ticker = new Ticker(this.onTick, timeout);
  }

  private onTick = (): void => {
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
