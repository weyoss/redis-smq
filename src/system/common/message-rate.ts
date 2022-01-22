import { ICallback, TMessageRateFields } from '../../../types';
import { events } from './events';
import { Ticker } from './ticker/ticker';
import { EventEmitter } from 'events';
import { TimeSeries } from './time-series/time-series';
import { MessageRateWriter } from './message-rate-writer';
import * as async from 'async';

export abstract class MessageRate<
  MessageRateFields extends TMessageRateFields = TMessageRateFields,
> extends EventEmitter {
  protected readerTicker: Ticker;
  protected messageRateWriter: MessageRateWriter<MessageRateFields>;

  constructor(messageRateWriter: MessageRateWriter<MessageRateFields>) {
    super();
    this.readerTicker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.readerTicker.runTimer();
    this.messageRateWriter = messageRateWriter;
  }

  protected onTick(): void {
    const ts = TimeSeries.getCurrentTimestamp();
    const rates = this.getRateFields();
    this.messageRateWriter.onRateTick(ts, rates);
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.readerTicker.once(events.DOWN, cb);
          this.readerTicker.quit();
        },
        (cb: ICallback<void>) => this.messageRateWriter.quit(cb),
      ],
      cb,
    );
  }

  abstract getRateFields(): MessageRateFields;
}
