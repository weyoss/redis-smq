import { IConsumerMessageRateFields } from '../../../types';
import { MessageRate } from '../common/message-rate';
import { events } from '../common/events';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected acknowledgedRate = 0;
  protected deadLetteredRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  // Returns true if the consumer has been
  // inactive for the last 5 seconds
  isIdle(): boolean {
    if (this.acknowledgedRate === 0 && this.deadLetteredRate === 0) {
      this.idleStack.push(1);
    } else {
      this.idleStack.push(0);
    }
    this.idleStack.shift();
    return this.idleStack.find((i) => i === 0) === undefined;
  }

  getRateFields(): IConsumerMessageRateFields {
    const acknowledgedRate = this.acknowledgedRate;
    this.acknowledgedRate = 0;
    const deadLetteredRate = this.deadLetteredRate;
    this.deadLetteredRate = 0;
    if (process.env.NODE_ENV === 'test' && this.isIdle()) {
      this.emit(events.IDLE);
    }
    return {
      acknowledgedRate,
      deadLetteredRate,
    };
  }

  incrementAcknowledged(): void {
    this.acknowledgedRate += 1;
  }

  incrementDeadLettered(): void {
    this.deadLetteredRate += 1;
  }
}
