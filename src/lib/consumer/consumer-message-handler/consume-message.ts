import { Message } from '../../message/message';
import { EMessageUnacknowledgedCause } from '../../../../types';
import { events } from '../../../common/events/events';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { MessageHandler } from './message-handler';
import { errors, RedisClient } from 'redis-smq-common';
import { ERetryStatus, retryMessage } from './retry-message';
import { acknowledgeMessage } from './acknowledge-message';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class ConsumeMessage {
  protected keyQueueProcessing: string;
  protected messageHandler: MessageHandler;
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(
    messageHandler: MessageHandler,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.messageHandler = messageHandler;
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      messageHandler.getQueue(),
      messageHandler.getConsumerId(),
    );
    this.keyQueueProcessing = keyQueueProcessing;
    this.logger = logger;
  }

  protected unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
  ): void {
    retryMessage(
      this.messageHandler.getConfig(),
      this.redisClient,
      this.keyQueueProcessing,
      msg,
      cause,
      (err, retryStatus) => {
        if (err) this.messageHandler.handleError(err);
        else if (!retryStatus)
          this.messageHandler.handleError(new errors.EmptyCallbackReplyError());
        else {
          this.messageHandler.emit(
            events.MESSAGE_UNACKNOWLEDGED,
            msg,
            EMessageUnacknowledgedCause.CONSUME_ERROR,
          );
          if (retryStatus.status === ERetryStatus.MESSAGE_DEAD_LETTERED) {
            this.messageHandler.emit(events.MESSAGE_DEAD_LETTERED, msg);
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
      const onConsumed: ICallback<void> = (err) => {
        if (this.messageHandler.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err) {
            this.logger.error(err);
            this.unacknowledgeMessage(
              msg,
              EMessageUnacknowledgedCause.UNACKNOWLEDGED,
            );
          } else {
            acknowledgeMessage(
              this.messageHandler.getConfig(),
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
      this.logger.error(error);
      this.unacknowledgeMessage(msg, EMessageUnacknowledgedCause.CONSUME_ERROR);
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
