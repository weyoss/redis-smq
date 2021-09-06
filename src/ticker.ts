import { TFunction } from '../types';

export class Ticker {
  protected timer: NodeJS.Timeout | null = null;
  protected interval: NodeJS.Timer | null = null;
  protected shutdownFn: TFunction | null = null;
  protected onTick: TFunction;
  protected time: number;

  constructor(onTick: TFunction, time: number) {
    this.onTick = onTick;
    this.time = time;
  }

  shutdown(fn: TFunction): void {
    this.shutdownFn = fn;
    if (this.timer) {
      clearTimeout(this.timer);
      this.shutdownFn();
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.shutdownFn();
    }
  }

  nextTick(): void {
    if (this.shutdownFn) this.shutdownFn();
    else {
      this.timer = setTimeout(this.onTick, this.time);
    }
  }

  autoRun(): void {
    this.interval = setInterval(() => {
      if (this.shutdownFn) {
        this.interval && clearInterval(this.interval);
        this.shutdownFn();
      } else this.onTick();
    }, this.time);
  }
}
