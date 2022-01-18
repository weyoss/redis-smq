import { ICallback, TMessageRateFields } from '../../../types';
import { events } from './events';
import { Ticker } from './ticker/ticker';
import { EventEmitter } from 'events';
import { TimeSeries } from './time-series/time-series';

export abstract class MessageRate<
  MessageRateFields extends TMessageRateFields = TMessageRateFields,
> extends EventEmitter {
  protected readerTicker: Ticker;

  constructor() {
    super();
    this.readerTicker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.readerTicker.runTimer();
  }

  protected onTick(): void {
    const ts = TimeSeries.getCurrentTimestamp();
    const rates = this.getRateFields();
    this.emit(events.RATE_TICK, ts, rates);
  }

  quit(cb: ICallback<void>): void {
    this.readerTicker.once(events.DOWN, cb);
    this.readerTicker.quit();
  }

  abstract getRateFields(): MessageRateFields;
}
