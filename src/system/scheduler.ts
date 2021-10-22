import { ICallback } from '../../types';
import { Message } from '../message';
import { EventEmitter } from 'events';
import { parseExpression } from 'cron-parser';
import { MessageManager } from '../message-manager';

export class Scheduler extends EventEmitter {
  protected messageManager: MessageManager;

  constructor(messageManager: MessageManager) {
    super();
    this.messageManager = messageManager;
  }

  getNextScheduledTimestamp(message: Message): number {
    if (this.isSchedulable(message)) {
      // Delay
      const msgScheduledDelay = message.getMessageScheduledDelay();
      if (msgScheduledDelay && !message.isDelayed()) {
        message.setMessageDelayed(true);
        return Date.now() + msgScheduledDelay;
      }

      // CRON
      const msgScheduledCron = message.getMessageScheduledCRON();
      const cronTimestamp = msgScheduledCron
        ? parseExpression(msgScheduledCron).next().getTime()
        : 0;

      // Repeat
      const msgScheduledRepeat = message.getMessageScheduledRepeat();
      let repeatTimestamp = 0;
      if (msgScheduledRepeat) {
        const newCount = message.getMessageScheduledRepeatCount() + 1;
        if (newCount <= msgScheduledRepeat) {
          const msgScheduledPeriod = message.getMessageScheduledPeriod();
          const now = Date.now();
          if (msgScheduledPeriod) {
            repeatTimestamp = now + msgScheduledPeriod;
          } else {
            repeatTimestamp = now;
          }
        }
      }

      if (repeatTimestamp && cronTimestamp) {
        if (
          repeatTimestamp < cronTimestamp &&
          message.hasScheduledCronFired()
        ) {
          message.incrMessageScheduledRepeatCount();
          return repeatTimestamp;
        }
      }

      if (cronTimestamp) {
        // reset repeat count on each cron tick
        message.resetMessageScheduledRepeatCount();

        // if the message has also a repeat scheduling then the first time it will fires only
        // after CRON scheduling has been fired
        message.setMessageScheduledCronFired(true);

        return cronTimestamp;
      }

      if (repeatTimestamp) {
        message.incrMessageScheduledRepeatCount();
        return repeatTimestamp;
      }
    }
    return 0;
  }

  enqueueScheduledMessages(
    queueName: string,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    this.messageManager.enqueueScheduledMessages(
      this,
      queueName,
      withPriority,
      cb,
    );
  }

  isSchedulable(message: Message): boolean {
    return (
      message.getMessageScheduledCRON() !== null ||
      message.getMessageScheduledDelay() !== null ||
      message.getMessageScheduledRepeat() > 0
    );
  }

  isPeriodic(message: Message): boolean {
    return (
      message.getMessageScheduledCRON() !== null ||
      message.getMessageScheduledRepeat() > 0
    );
  }

  schedule(queueName: string, message: Message, cb: ICallback<boolean>): void {
    const timestamp = this.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      this.messageManager.scheduleMessage(
        queueName,
        message,
        timestamp,
        (err) => {
          if (err) cb(err);
          else cb(null, true);
        },
      );
    } else cb(null, false);
  }

  quit(cb: ICallback<void>): void {
    cb();
  }
}
