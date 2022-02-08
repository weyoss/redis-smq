import { Ticker } from './ticker/ticker';
import { ICallback, TMessageRateFields } from '../../../types';
import { events } from './events';

export abstract class MessageRateWriter<
  TRateFields extends TMessageRateFields,
> {
  protected writerTicker: Ticker;
  protected rateStack: [number, TMessageRateFields][] = [];

  constructor() {
    this.writerTicker = new Ticker(() => void 0, 1000);
    this.writerTicker.nextTickFn(() => {
      this.updateTimeSeries();
    });
  }

  protected updateTimeSeries(): void {
    const item = this.rateStack.shift();
    if (item) {
      const [ts, rates] = item;
      this.onUpdate(ts, rates, () => {
        this.writerTicker.nextTickFn(() => this.updateTimeSeries());
      });
    } else this.writerTicker.nextTickFn(() => this.updateTimeSeries());
  }

  abstract onUpdate(
    ts: number,
    rates: TMessageRateFields,
    cb: ICallback<void>,
  ): void;

  onRateTick = (ts: number, rates: TRateFields): void => {
    this.rateStack.push([ts, rates]);
  };

  quit(cb: ICallback<void>): void {
    this.writerTicker.on(events.DOWN, cb);
    this.writerTicker.quit();
  }
}
