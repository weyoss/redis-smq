import { ICallback, TFunction } from '../types';

export class Ticker {
  protected isRunning = false;
  protected timer: NodeJS.Timeout | null = null;
  protected interval: NodeJS.Timer | null = null;
  protected onTick: TFunction;
  protected time: number;

  constructor(onTick: TFunction, time: number) {
    this.onTick = onTick;
    this.time = time;
    this.isRunning = true;
  }

  shutdown(cb?: ICallback<void>): void {
    if (!this.isRunning) {
      throw new Error('Ticker is already down');
    }
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (cb) {
      cb();
    }
  }

  nextTick(): void {
    if (!this.isRunning) {
      throw new Error('Ticker is down');
    }
    this.timer = setTimeout(this.onTick, this.time);
  }

  runTimer(): void {
    if (!this.isRunning) {
      throw new Error('Ticker is down');
    }
    this.interval = setInterval(() => {
      if (this.isRunning) {
        this.onTick();
      }
    }, this.time);
  }
}
