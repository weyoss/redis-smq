import { ICallback, TFunction } from '../types';
import { EventEmitter } from 'events';
import { events } from './events';

export class Ticker extends EventEmitter {
  protected isRunning = false;
  protected timer: NodeJS.Timeout | null = null;
  protected interval: NodeJS.Timer | null = null;
  protected onTick: TFunction;
  protected time: number;

  constructor(onTick: TFunction, time: number) {
    super();
    this.onTick = onTick;
    this.time = time;
    this.isRunning = true;
  }

  shutdown(cb?: ICallback<void>): void {
    if (!this.isRunning) {
      const err = new Error('Ticker is already down');
      if (cb) cb(err);
      else this.emit(events.ERROR, err);
    } else {
      this.isRunning = false;
      if (this.timer) clearTimeout(this.timer);
      if (this.interval) clearInterval(this.interval);
      if (cb) cb();
    }
  }

  nextTick(): void {
    if (!this.isRunning) this.emit(events.ERROR, new Error('Ticker is down'));
    else this.timer = setTimeout(this.onTick, this.time);
  }

  runTimer(): void {
    if (!this.isRunning) this.emit(events.ERROR, new Error('Ticker is down'));
    else {
      this.interval = setInterval(() => {
        if (this.isRunning) {
          this.onTick();
        }
      }, this.time);
    }
  }
}
