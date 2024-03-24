/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import {
  CallbackEmptyReplyError,
  getDirname,
  ICallback,
  ILogger,
  logger,
  Runnable,
  TRedisClientEvent,
  TUnaryFunction,
  WorkerResourceGroup,
} from 'redis-smq-common';
import { TConsumerEvent } from '../../../common/index.js';
import { RedisClientFactory } from '../../../common/redis-client/redis-client-factory.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { EventBusRedisFactory } from '../../event-bus/event-bus-redis-factory.js';
import { IQueueParsedParams, TQueueExtendedParams } from '../../queue/index.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import { _cleanupOfflineConsumer } from '../consumer-heartbeat/_/_cleanup-offline-consumer.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import { ConsumerHeartbeat } from '../consumer-heartbeat/consumer-heartbeat.js';
import { MessageHandlerRunner } from '../message-handler-runner/message-handler-runner.js';
import { MultiplexedMessageHandlerRunner } from '../message-handler-runner/multiplexed-message-handler-runner.js';
import { TConsumerMessageHandler } from '../types/index.js';

export class Consumer extends Runnable<TConsumerEvent> {
  protected messageHandlerRunner;
  protected logger;
  protected redisClient;
  protected eventBus;

  protected heartbeat: ConsumerHeartbeat | null = null;
  protected workerResourceGroup: WorkerResourceGroup | null = null;

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

  protected setUpConsumerWorkers = (cb: ICallback<void>): void => {
    const config = Configuration.getSetConfig();
    const { keyLockConsumerWorkersRunner } = redisKeys.getMainKeys();
    const nsLogger = logger.getLogger(
      config.logger,
      `consumer:${this.id}:worker-runner`,
    );
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    this.workerResourceGroup = new WorkerResourceGroup(
      redisClient,
      nsLogger,
      keyLockConsumerWorkersRunner,
    );
    this.workerResourceGroup.on('workerResourceGroup.error', (err) =>
      this.handleError(err),
    );
    const workersDir = path.resolve(getDirname(), '../workers');
    this.workerResourceGroup.loadFromDir(workersDir, config, (err) => {
      if (err) cb(err);
      else {
        this.workerResourceGroup?.run((err) => {
          if (err) this.handleError(err);
        });
        cb();
      }
    });
  };

  protected shutDownConsumerWorkers = (cb: ICallback<void>): void => {
    if (this.workerResourceGroup) {
      this.workerResourceGroup.shutdown(() => {
        this.workerResourceGroup = null;
        cb();
      });
    } else {
      cb();
    }
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
      this.setUpConsumerWorkers,
    ]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    this.emit('consumer.goingDown', this.id);
    return [
      this.shutDownConsumerWorkers,
      this.shutdownMessageHandlers,
      this.shutDownHeartbeat,
      (cb: ICallback<void>) => {
        const redisClient = this.redisClient.getInstance();
        if (redisClient instanceof Error) {
          cb();
          return void 0;
        }
        _cleanupOfflineConsumer(redisClient, [this.id], cb);
      },
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

  cancel(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) cb(parsedQueueParams);
    else {
      this.messageHandlerRunner.removeMessageHandler(parsedQueueParams, cb);
    }
  }

  getQueues(): IQueueParsedParams[] {
    return this.messageHandlerRunner.getQueues();
  }
}
