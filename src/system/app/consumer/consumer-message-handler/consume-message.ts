import { Message } from '../../message/message';
import { EMessageUnacknowledgedCause } from '../../../../../types';
import { broker } from '../../../common/broker/broker';
import { events } from '../../../common/events';
import { ConsumerError } from '../errors/consumer.error';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { MessageHandler } from './message-handler';

export class ConsumeMessage {
  protected keyQueueProcessing: string;
  protected messageHandler: MessageHandler;
  protected redisClient: RedisClient;

  constructor(messageHandler: MessageHandler, redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.messageHandler = messageHandler;
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      messageHandler.getQueue(),
      messageHandler.getConsumerId(),
    );
    this.keyQueueProcessing = keyQueueProcessing;
  }

  protected unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    if (err) {
      // log error
    }
    broker.retry(
      this.redisClient,
      this.keyQueueProcessing,
      msg,
      cause,
      (err, deadLetterCause) => {
        if (err) this.messageHandler.handleError(err);
        else {
          this.messageHandler.emit(events.MESSAGE_UNACKNOWLEDGED, msg, cause);
          if (deadLetterCause !== undefined) {
            this.messageHandler.emit(
              events.MESSAGE_DEAD_LETTERED,
              msg,
              deadLetterCause,
            );
          }
        }
      },
    );
  }

  protected consumeMessage(msg: Message): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    try {
      const consumeTimeout = msg.getConsumeTimeout();
      if (consumeTimeout) {
        timer = setTimeout(() => {
          isTimeout = true;
          timer = null;
          this.unacknowledgeMessage(msg, EMessageUnacknowledgedCause.TIMEOUT);
        }, consumeTimeout);
      }
      const onConsumed = (err?: Error | null) => {
        if (this.messageHandler.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err)
            this.unacknowledgeMessage(
              msg,
              EMessageUnacknowledgedCause.UNACKNOWLEDGED,
              err,
            );
          else {
            broker.acknowledgeMessage(
              this.redisClient,
              msg,
              this.keyQueueProcessing,
              (err) => {
                if (err) this.messageHandler.handleError(err);
                else this.messageHandler.emit(events.MESSAGE_ACKNOWLEDGED, msg);
              },
            );
          }
        }
      };

      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.messageHandler.getHandler()(
        Message.createFromMessage(msg),
        onConsumed,
      );
    } catch (error: unknown) {
      const err =
        error instanceof Error
          ? error
          : new ConsumerError(
              `An error occurred while processing message ID (${msg.getRequiredId()})`,
            );
      this.unacknowledgeMessage(
        msg,
        EMessageUnacknowledgedCause.CAUGHT_ERROR,
        err,
      );
    }
  }

  handleReceivedMessage(message: Message): void {
    if (message.getSetExpired()) {
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgedCause.TTL_EXPIRED,
      );
    } else this.consumeMessage(message);
  }
}
