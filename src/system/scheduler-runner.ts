import { ICallback, IConfig } from '../../types';
import { Ticker } from './ticker';
import { events } from './events';
import { EventEmitter } from 'events';
import { Scheduler } from './scheduler';

export class SchedulerRunner extends EventEmitter {
  protected scheduler: Scheduler;
  protected config: IConfig;
  protected queueName: string;
  protected ticker: Ticker;

  constructor(
    queueName: string,
    config: IConfig,
    scheduler: Scheduler,
    tickPeriod = 1000,
  ) {
    super();
    this.queueName = queueName;
    this.config = config;
    this.scheduler = scheduler;
    this.ticker = new Ticker(() => {
      this.onTick();
    }, tickPeriod);
    this.ticker.nextTick();
  }

  protected onTick(): void {
    const withPriority = this.config.priorityQueue === true;
    this.scheduler.enqueueScheduledMessages(
      this.queueName,
      withPriority,
      (err) => {
        if (err) this.emit(events.ERROR, err);
        else this.ticker.nextTick();
      },
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
