/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EConsumeMessageDeadLetterCause,
  EConsumeMessageUnacknowledgedCause,
  TConsumerMessageHandler,
  IQueueParams,
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../../types';
import { v4 as uuid } from 'uuid';
import { processingQueue } from './processing-queue';
import { DequeueMessage } from './dequeue-message';
import { ConsumeMessage } from './consume-message';
import { Consumer } from '../consumer';
import {
  async,
  PowerSwitch,
  RedisClient,
  ICallback,
  ILogger,
  CallbackEmptyReplyError,
  CallbackInvalidReplyError,
  EventEmitter,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { _fromMessage } from '../../message/_from-message';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { TRedisSMQEvent } from '../../../../types';

export class MessageHandler extends EventEmitter<TRedisSMQEvent> {
  protected id: string;
  protected consumer: Consumer;
  protected consumerId: string;
  protected queue: IQueueParams;
  protected dequeueRedisClient: RedisClient;
  protected sharedRedisClient: RedisClient;
  protected powerSwitch: PowerSwitch;
  protected logger: ILogger;
  protected dequeueMessage: DequeueMessage;
  protected consumeMessage: ConsumeMessage;
  protected handler: TConsumerMessageHandler;

  constructor(
    consumer: Consumer,
    queue: IQueueParams,
    handler: TConsumerMessageHandler,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
    logger: ILogger,
  ) {
    super();
    this.id = uuid();
    this.consumer = consumer;
    this.consumerId = consumer.getId();
    this.queue = queue;
    this.dequeueRedisClient = dequeueRedisClient;
    this.sharedRedisClient = sharedRedisClient;
    this.handler = handler;
    this.powerSwitch = new PowerSwitch();
    this.logger = logger;
    this.dequeueMessage = new DequeueMessage(this, dequeueRedisClient, true);
    this.consumeMessage = new ConsumeMessage(this, dequeueRedisClient, logger);
    this.registerEventsHandlers();
  }

  protected registerEventsHandlers(): void {
    this.on('up', () => {
      this.logger.info('Up and running...');
      this.dequeueMessage.dequeue();
    });
    this.on('next', () => {
      if (this.powerSwitch.isRunning()) {
        this.dequeueMessage.dequeue();
      }
    });
    this.on('messageAcknowledged', (messageId: string) => {
      this.logger.info(`Message (ID ${messageId}) acknowledged`);
      this.emit('next');
    });
    this.on(
      'messageDeadLettered',
      (cause: EConsumeMessageDeadLetterCause, messageId: string) => {
        this.logger.info(
          `Message (ID ${messageId}) dead-lettered (cause ${cause})`,
        );
      },
    );
    this.on(
      'messageUnacknowledged',
      (cause: EConsumeMessageUnacknowledgedCause, messageId: string) => {
        this.logger.info(
          `Message (ID ${messageId}) unacknowledged (cause ${cause})`,
        );
        this.emit('next');
      },
    );
    this.on('messageReceived', (messageId: string) => {
      this.logger.info(`Got message (ID ${messageId})...`);
      if (this.powerSwitch.isRunning()) {
        this.processMessage(messageId);
      }
    });
    this.on('down', () => this.logger.info('Down.'));
  }

  protected processMessage(messageId: string): void {
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const keys: string[] = [keyMessage];
    const argv: (string | number)[] = [
      EMessageProperty.STATUS,
      EMessageProperty.STATE,
      EMessageProperty.MESSAGE,
      EMessagePropertyStatus.PROCESSING,
    ];
    this.dequeueRedisClient.runScript(
      ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING,
      keys,
      argv,
      (err, reply: unknown) => {
        if (err) this.handleError(err);
        else if (!reply) this.handleError(new CallbackEmptyReplyError());
        else if (!Array.isArray(reply))
          this.handleError(new CallbackInvalidReplyError());
        else {
          const [state, msg]: string[] = reply;
          const message = _fromMessage(
            msg,
            EMessagePropertyStatus.PROCESSING,
            state,
          );
          this.consumeMessage.handleReceivedMessage(message);
        }
      },
    );
  }

  protected cleanUp(
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    processingQueue.handleProcessingQueue(
      this.sharedRedisClient,
      [this.consumerId],
      [this.queue],
      this.logger,
      messageUnacknowledgedCause,
      (err) => cb(err),
    );
  }

  protected shutdownDequeueClient(cb: ICallback<void>): void {
    this.dequeueRedisClient.halt(cb);
  }

  handleError(err: Error): void {
    if (this.powerSwitch.isRunning() || this.powerSwitch.isGoingUp()) {
      this.emit('error', err);
    }
  }

  dequeue(): void {
    this.dequeueMessage.dequeue();
  }

  run(cb: ICallback<void>): void {
    this.powerSwitch.goingUp();
    this.dequeueMessage.run((err) => {
      if (err) cb(err);
      else {
        this.powerSwitch.commit();
        this.emit('up');
        cb();
      }
    });
  }

  shutdown(
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const goDown = () => {
      this.powerSwitch.goingDown();
      async.waterfall(
        [
          (cb: ICallback<void>) => this.dequeueMessage.quit(cb),
          (cb: ICallback<void>) => this.cleanUp(messageUnacknowledgedCause, cb),
          (cb: ICallback<void>) => this.shutdownDequeueClient(cb),
        ],
        (err) => {
          if (err) cb(err);
          else {
            this.powerSwitch.commit();
            this.emit('down');
            cb();
          }
        },
      );
    };
    if (this.powerSwitch.isGoingUp()) this.once('up', goDown);
    else goDown();
  }

  getQueue(): IQueueParams {
    return this.queue;
  }

  getConsumerId(): string {
    return this.consumerId;
  }

  getId(): string {
    return this.id;
  }

  isRunning(): boolean {
    return this.powerSwitch.isRunning();
  }

  getHandler(): TConsumerMessageHandler {
    return this.handler;
  }
}
