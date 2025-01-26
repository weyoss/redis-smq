/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  logger,
  Runnable,
  TRedisClientEvent,
  TUnaryFunction,
} from 'redis-smq-common';
import { TConsumerEvent } from '../../../common/index.js';
import { RedisClientFactory } from '../../../common/redis-client/redis-client-factory.js';
import { Configuration } from '../../../config/index.js';
import { EventBusRedisFactory } from '../../event-bus/event-bus-redis-factory.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import { IQueueParsedParams, TQueueExtendedParams } from '../../queue/index.js';
import { ConsumerHeartbeat } from '../consumer-heartbeat/consumer-heartbeat.js';
import { MessageHandlerRunner } from '../message-handler-runner/message-handler-runner.js';
import { MultiplexedMessageHandlerRunner } from '../message-handler-runner/multiplexed-message-handler-runner.js';
import { TConsumerMessageHandler } from '../types/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';

export class Consumer extends Runnable<TConsumerEvent> {
  protected messageHandlerRunner;
  protected logger;
  protected redisClient;
  protected eventBus;
  protected heartbeat: ConsumerHeartbeat | null = null;

  constructor(enableMultiplexing?: boolean) {
    super();
    const config = Configuration.getSetConfig();
    this.logger = logger.getLogger(
      config.logger,
      `consumer:${this.id}:message-handler`,
    );
    this.redisClient = RedisClientFactory(this.id, (err) =>
      this.handleError(err),
    );
    if (Configuration.getSetConfig().eventBus.enabled) {
      this.eventBus = EventBusRedisFactory(this.id, (err) =>
        this.handleError(err),
      );
      eventBusPublisher(this, this.logger);
    }
    this.messageHandlerRunner = enableMultiplexing
      ? new MultiplexedMessageHandlerRunner(this, this.logger)
      : new MessageHandlerRunner(this, this.logger);
    this.messageHandlerRunner.on('consumer.messageHandlerRunner.error', (err) =>
      this.handleError(err),
    );
  }

  protected onRedisError: TRedisClientEvent['error'] = (error) => {
    this.handleError(error);
  };

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    this.heartbeat = new ConsumerHeartbeat(this, this.logger);
    this.heartbeat.on('consumerHeartbeat.error', (err) =>
      this.handleError(err),
    );
    this.heartbeat.run((err) => cb(err));
  };

  protected shutDownHeartbeat = (cb: ICallback<void>): void => {
    if (this.heartbeat) {
      this.heartbeat.shutdown(() => {
        this.heartbeat = null;
        cb();
      });
    } else cb();
  };

  protected runMessageHandlers = (cb: ICallback<void>): void => {
    this.messageHandlerRunner.run((err) => cb(err));
  };

  protected shutdownMessageHandlers = (cb: ICallback<void>): void => {
    this.messageHandlerRunner.shutdown(() => cb());
  };

  protected initRedisClient = (cb: ICallback<void>): void => {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.on('error', this.onRedisError);
        cb();
      }
    });
  };

  protected shutDownRedisClient = (cb: ICallback<void>): void => {
    this.redisClient.shutdown(() => cb());
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([
      (cb) => {
        if (this.eventBus) this.eventBus.init(cb);
        else cb();
      },
      // explicitly emitting the goingUp event after eventbus initialization
      (cb) => {
        this.emit('consumer.goingUp', this.id);
        cb();
      },
      this.initRedisClient,
      this.setUpHeartbeat,
      this.runMessageHandlers,
    ]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    this.emit('consumer.goingDown', this.id);
    return [
      this.shutdownMessageHandlers,
      this.shutDownHeartbeat,
      this.shutDownRedisClient,
    ].concat(super.goingDown());
  }

  protected override up(cb: ICallback<boolean>) {
    super.up(() => {
      this.emit('consumer.up', this.id);
      cb(null, true);
    });
  }

  protected override down(cb: ICallback<boolean>) {
    super.down(() => {
      this.emit('consumer.down', this.id);
      // not tearing down the eventbus immediately
      setTimeout(() => {
        if (this.eventBus) {
          this.eventBus.shutdown(() => cb(null, true));
        } else cb(null, true);
      }, 1000);
    });
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override handleError(err: Error) {
    this.emit('consumer.error', err, this.id);
    super.handleError(err);
  }

  /**
   * Start listening for messages on the specified queue.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/consuming-messages.md
   * @param {TQueueExtendedParams} queue - A queue from which messages will be consumed. Before consuming
   * messages from a queue make sure that the specified queue already exists in
   * the system.
   * @param {TConsumerMessageHandler} messageHandler - A callback function that defines how to process each
   * message consumed from the queue. The messageHandler will receive the
   * message as an argument and should implement the logic for processing the
   * message. This might include business logic, transformation, storage, etc.
   * It's crucial that this function handles exceptions and errors properly to
   * avoid issues with message acknowledgment.
   * @param {ICallback<void>} cb - The callback function will be executed after the consumption process is initiated.
   * It typically signifies the end of the consumption setup and can be used to
   * handle success or errors in starting the consumption process.
   */
  consume(
    queue: TQueueExtendedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) cb(parsedQueueParams);
    else {
      this.messageHandlerRunner.addMessageHandler(
        parsedQueueParams,
        messageHandler,
        cb,
      );
    }
  }

  /**
   * Cancel consuming messages from the provided queue.
   *
   * @param {TQueueExtendedParams} queue - Queue parameters
   * @param {ICallback<void>} cb - A callback function
   */
  cancel(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) cb(parsedQueueParams);
    else {
      this.messageHandlerRunner.removeMessageHandler(parsedQueueParams, cb);
    }
  }

  /**
   * Retrieve the list of queues being consumed by a Consumer instance.
   *
   * @returns {IQueueParsedParams[]} - Queue list
   */
  getQueues(): IQueueParsedParams[] {
    return this.messageHandlerRunner.getQueues();
  }
}
