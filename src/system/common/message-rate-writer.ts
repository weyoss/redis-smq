import { Ticker } from './ticker/ticker';
import { ICallback, TMessageRateFields } from '../../../types';
import { MessageRate } from './message-rate';
import { events } from './events';
import * as async from 'async';

export abstract class MessageRateWriter {
  protected writerTicker: Ticker;
  protected rateStack: [number, TMessageRateFields][] = [];

  constructor(messageRate: MessageRate) {
    this.writerTicker = new Ticker(() => void 0, 1000);
    this.writerTicker.nextTickFn(() => {
      this.updateTimeSeries();
    });
    messageRate.on(
      events.RATE_TICK,
      (ts: number, rates: TMessageRateFields) => {
        this.rateStack.push([ts, rates]);
      },
    );
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

  abstract onQuit(cb: ICallback<void>): void;

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.writerTicker.on(events.DOWN, cb);
          this.writerTicker.quit();
        },
        (cb: ICallback<void>) => this.onQuit(cb),
      ],
      cb,
    );
  }
}
