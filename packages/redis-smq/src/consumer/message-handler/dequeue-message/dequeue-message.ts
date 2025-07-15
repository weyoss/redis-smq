/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as os from 'os';
import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  logger,
  PanicError,
  Runnable,
  Timer,
} from 'redis-smq-common';
import { TConsumerDequeueMessageEvent } from '../../../common/index.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { _saveConsumerGroup } from '../../../consumer-groups/_/_save-consumer-group.js';
import { _hasRateLimitExceeded } from '../../../queue-rate-limit/_/_has-rate-limit-exceeded.js';
import { _getQueueProperties } from '../../../queue/_/_get-queue-properties.js';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParsedParams,
  IQueueRateLimit,
  QueueQueueNotFoundError,
  TQueueConsumer,
} from '../../../queue/index.js';
import { Consumer } from '../../consumer.js';
import {
  ConsumerConsumerGroupIdNotSupportedError,
  ConsumerConsumerGroupIdRequiredError,
} from '../../errors/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import { EventBus } from '../../../event-bus/index.js';
import { ConsumerMessageHandlerError } from '../errors/index.js';

const IPAddresses = (() => {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const netInterface in nets) {
    const addr = nets[netInterface] ?? [];
    for (const netAddr of addr) {
      if (netAddr.family === 'IPv4' && !netAddr.internal) {
        addresses.push(netAddr.address);
      }
    }
  }
  return addresses;
})();

export class DequeueMessage extends Runnable<TConsumerDequeueMessageEvent> {
  protected redisClient;
  protected queue;
  protected consumerId;
  protected timer;
  protected keyQueues;
  protected keyQueueConsumers;
  protected keyConsumerQueues;
  protected keyQueueProcessingQueues;
  protected keyQueueProcessing;
  protected keyQueuePending;
  protected keyQueuePriorityPending;
  protected logger;
  protected blockUntilMessageReceived;
  protected autoCloseRedisConnection;
  protected eventBus;

  protected queueRateLimit: IQueueRateLimit | null = null;
  protected queueType: EQueueType | null = null;
  protected idleThreshold = 5;
  protected idleTrigger = 0;

  constructor(
    redisClient: RedisClient,
    queue: IQueueParsedParams,
    consumer: Consumer,
    eventBus: EventBus | null,
    blockUntilMessageReceived: boolean = true,
    autoCloseRedisConnection = true,
  ) {
    super();
    this.queue = queue;
    this.consumerId = consumer.getId();
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );

    this.logger.info(
      `Initializing DequeueMessage for consumer ${this.consumerId}, queue ${JSON.stringify(this.queue)}`,
    );
    this.logger.debug(
      `blockUntilMessageReceived: ${blockUntilMessageReceived}, autoCloseRedisConnection: ${autoCloseRedisConnection}`,
    );

    this.blockUntilMessageReceived = blockUntilMessageReceived;
    this.autoCloseRedisConnection = autoCloseRedisConnection;
    this.redisClient = redisClient;

    this.logger.debug('Setting up Redis client error handler');
    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
      this.handleError(err);
    });

    if (!eventBus) {
      this.logger.debug('No event bus provided, creating new instance');
      this.eventBus = new EventBus();
      this.eventBus.on('error', (err) => {
        this.logger.error(`Event bus error: ${err.message}`);
        this.handleError(err);
      });
    } else {
      this.logger.debug('Using provided event bus instance');
      this.eventBus = eventBus;
    }

    if (Configuration.getSetConfig().eventBus.enabled) {
      this.logger.debug('Event bus is enabled, setting up event bus publisher');
      eventBusPublisher(this, this.eventBus, this.logger);
    } else {
      this.logger.debug(
        'Event bus is disabled, skipping event bus publisher setup',
      );
    }

    this.logger.debug('Setting up Redis keys');
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(this.consumerId);
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerId,
    );
    const { keyQueues } = redisKeys.getMainKeys();
    const {
      keyQueueProcessingQueues,
      keyQueuePending,
      keyQueuePriorityPending,
      keyQueueConsumers,
    } = redisKeys.getQueueKeys(this.queue.queueParams, this.queue.groupId);

    this.keyQueuePriorityPending = keyQueuePriorityPending;
    this.keyQueuePending = keyQueuePending;
    this.keyQueueProcessing = keyQueueProcessing;
    this.keyQueues = keyQueues;
    this.keyQueueConsumers = keyQueueConsumers;
    this.keyConsumerQueues = keyConsumerQueues;
    this.keyQueueProcessingQueues = keyQueueProcessingQueues;

    this.logger.debug(`Queue keys initialized: 
      keyQueuePriorityPending: ${this.keyQueuePriorityPending}
      keyQueuePending: ${this.keyQueuePending}
      keyQueueProcessing: ${this.keyQueueProcessing}
      keyQueues: ${this.keyQueues}
      keyQueueConsumers: ${this.keyQueueConsumers}
      keyConsumerQueues: ${this.keyConsumerQueues}
      keyQueueProcessingQueues: ${this.keyQueueProcessingQueues}`);

    this.logger.debug('Initializing timer');
    this.timer = new Timer();
    this.timer.on('error', (err) => {
      this.logger.error(`Timer error: ${err.message}`);
      this.handleError(err);
    });

    this.logger.info(
      `DequeueMessage initialized for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override handleError(err: Error) {
    this.logger.error(`DequeueMessage error: ${err.message}`, err);
    if (this.isRunning()) {
      this.logger.debug(
        `Emitting consumer.dequeueMessage.error event for consumer ${this.consumerId}`,
      );
      this.emit(
        'consumer.dequeueMessage.error',
        err,
        this.consumerId,
        this.queue,
      );
    }
    super.handleError(err);
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(
      `DequeueMessage going up for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        this.logger.debug('Initializing Redis client');
        this.redisClient.init((err) => {
          if (err) {
            this.logger.error(
              `Failed to initialize Redis client: ${err.message}`,
            );
          } else {
            this.logger.debug('Redis client initialized successfully');
          }
          cb(err);
        });
      },
      (cb: ICallback<void>) => {
        this.logger.debug('Registering consumer with queue');
        const consumerInfo: TQueueConsumer = {
          ipAddress: IPAddresses,
          hostname: os.hostname(),
          pid: process.pid,
          createdAt: Date.now(),
        };
        this.logger.debug(`Consumer info: ${JSON.stringify(consumerInfo)}`);

        const redisClient = this.redisClient.getInstance();
        if (redisClient instanceof Error) {
          this.logger.error(
            `Failed to get Redis client instance: ${redisClient.message}`,
          );
          cb(redisClient);
          return void 0;
        }

        const keys = [
          this.keyQueues,
          this.keyQueueConsumers,
          this.keyConsumerQueues,
          this.keyQueueProcessingQueues,
          this.keyQueueProcessing,
        ];
        const args = [
          this.consumerId,
          JSON.stringify(consumerInfo),
          JSON.stringify(this.queue.queueParams),
        ];
        this.logger.debug(`Running SUBSCRIBE_CONSUMER script`);
        redisClient.runScript(
          ELuaScriptName.SUBSCRIBE_CONSUMER,
          keys,
          args,
          (err, reply) => {
            if (err) {
              this.logger.error(
                `SUBSCRIBE_CONSUMER script failed: ${err.message}`,
              );
              return cb(err);
            }

            if (reply === 'QUEUE_NOT_FOUND') {
              this.logger.error('Queue not found');
              return cb(new QueueQueueNotFoundError());
            }

            if (reply === 'OK') {
              this.logger.debug('Consumer successfully registered with queue');
              return cb();
            }

            cb(
              new ConsumerMessageHandlerError(
                `Received unexpected reply message: ${reply}`,
              ),
            );
          },
        );
      },
      (cb: ICallback<void>) => {
        this.logger.debug('Getting queue properties');
        const redisClient = this.redisClient.getInstance();
        if (redisClient instanceof Error) {
          this.logger.error(
            `Failed to get Redis client instance: ${redisClient.message}`,
          );
          cb(redisClient);
          return void 0;
        }

        _getQueueProperties(
          redisClient,
          this.queue.queueParams,
          (err, queueProperties) => {
            if (err) {
              this.logger.error(
                `Failed to get queue properties: ${err.message}`,
              );
              cb(err);
            } else if (!queueProperties) {
              this.logger.error('Empty queue properties reply');
              cb(new CallbackEmptyReplyError());
            } else {
              this.queueType = queueProperties.queueType;
              this.queueRateLimit = queueProperties.rateLimit ?? null;

              this.logger.debug(`Queue properties retrieved: 
                queueType: ${EQueueType[this.queueType]}
                rateLimit: ${this.queueRateLimit ? JSON.stringify(this.queueRateLimit) : 'null'}
                deliveryModel: ${EQueueDeliveryModel[queueProperties.deliveryModel]}`);

              const { queueParams, groupId } = this.queue;

              // P2P delivery model
              if (
                queueProperties.deliveryModel ===
                EQueueDeliveryModel.POINT_TO_POINT
              ) {
                if (groupId) {
                  this.logger.error(
                    'Consumer group ID not supported for point-to-point delivery model',
                  );
                  cb(new ConsumerConsumerGroupIdNotSupportedError());
                } else {
                  this.logger.debug('Point-to-point delivery model validated');
                  cb();
                }
              }
              // PubSub delivery model
              else if (
                queueProperties.deliveryModel === EQueueDeliveryModel.PUB_SUB
              ) {
                if (!groupId) {
                  this.logger.error(
                    'Consumer group ID required for pub/sub delivery model',
                  );
                  cb(new ConsumerConsumerGroupIdRequiredError());
                } else {
                  this.logger.debug(
                    `Pub/sub delivery model with group ID: ${groupId}`,
                  );
                  const eventBus = this.eventBus.getInstance();
                  if (eventBus instanceof Error) {
                    this.logger.error(
                      `Failed to get event bus instance: ${eventBus.message}`,
                    );
                    cb(eventBus);
                  } else {
                    this.logger.debug(
                      `Saving consumer group ${groupId} for queue ${queueParams.name}`,
                    );
                    _saveConsumerGroup(
                      redisClient,
                      eventBus,
                      queueParams,
                      groupId,
                      (err, result) => {
                        if (err) {
                          this.logger.error(
                            `Failed to save consumer group: ${err.message}`,
                          );
                        } else {
                          this.logger.debug(
                            `Consumer group saved successfully, result: ${result}`,
                          );
                        }
                        cb(err);
                      },
                    );
                  }
                }
              }
              // Unknown delivery model
              else {
                this.logger.error(
                  `Unknown delivery model: ${queueProperties.deliveryModel}`,
                );
                cb(new PanicError('UNKNOWN_DELIVERY_MODEL'));
              }
            }
          },
        );
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(
      `DequeueMessage going down for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return [
      (cb: ICallback<void>): void => {
        this.logger.debug('Resetting timer');
        this.timer.reset();

        if (!this.autoCloseRedisConnection) {
          this.logger.debug(
            'Skipping Redis connection close (autoCloseRedisConnection is false)',
          );
          return cb();
        }

        this.logger.debug('Closing Redis connection');
        const redisClient = this.redisClient.getInstance();
        // ignoring errors
        if (redisClient instanceof Error) {
          this.logger.warn(
            `Could not get Redis client during shutdown: ${redisClient.message} (ignoring)`,
          );
          return cb();
        }

        redisClient.halt((err) => {
          if (err) {
            this.logger.warn(
              `Error halting Redis client: ${err.message} (ignoring)`,
            );
          } else {
            this.logger.debug('Redis client halted successfully');
          }
          cb();
        });
      },
    ].concat(super.goingDown());
  }

  protected updateIdle(): void {
    this.idleTrigger = this.idleTrigger + 1;
    this.logger.debug(
      `Idle trigger updated: ${this.idleTrigger}/${this.idleThreshold}`,
    );
  }

  protected resetIdle(): void {
    if (this.idleTrigger > 0) {
      this.logger.debug(`Resetting idle trigger from ${this.idleTrigger} to 0`);
    }
    this.idleTrigger = 0;
  }

  protected isIdle(): boolean {
    const idle = this.idleTrigger >= this.idleThreshold;
    if (idle) {
      this.logger.debug(
        `Queue is idle (trigger: ${this.idleTrigger}, threshold: ${this.idleThreshold})`,
      );
    }
    return idle;
  }

  protected isPriorityQueuingEnabled(): boolean {
    const enabled = this.queueType === EQueueType.PRIORITY_QUEUE;
    this.logger.debug(
      `Priority queuing ${enabled ? 'enabled' : 'disabled'} (queueType: ${this.queueType})`,
    );
    return enabled;
  }

  protected handleMessage: ICallback<string | null> = (err, messageId) => {
    if (err) {
      this.logger.error(`Error handling message: ${err.message}`);
      this.timer.reset();
      this.handleError(err);
    } else if (typeof messageId === 'string') {
      this.logger.info(`Message received: ${messageId}`);
      this.resetIdle();

      this.logger.debug(
        `Emitting consumer.dequeueMessage.messageReceived event for message ${messageId}`,
      );
      this.emit(
        'consumer.dequeueMessage.messageReceived',
        messageId,
        this.queue,
        this.consumerId,
      );
    } else {
      this.logger.debug('No message received, requesting next message');
      this.updateIdle();

      this.logger.debug('Emitting consumer.dequeueMessage.nextMessage event');
      this.emit('consumer.dequeueMessage.nextMessage');
    }
  };

  protected dequeueWithRateLimit = (redisClient: IRedisClient): boolean => {
    if (this.queueRateLimit) {
      this.logger.debug(
        `Checking rate limit: ${JSON.stringify(this.queueRateLimit)}`,
      );

      _hasRateLimitExceeded(
        redisClient,
        this.queue.queueParams,
        this.queueRateLimit,
        (err, isExceeded) => {
          if (err) {
            this.logger.error(`Error checking rate limit: ${err.message}`);
            this.handleError(err);
          } else if (isExceeded) {
            this.logger.debug(
              `Rate limit exceeded, delaying dequeue for 1000ms`,
            );
            this.timer.setTimeout(() => {
              this.dequeue();
            }, 1000);
          } else {
            this.logger.debug(
              'Rate limit not exceeded, proceeding with dequeue',
            );
            this.dequeueWithRateLimitExec(redisClient);
          }
        },
      );
      return true;
    }
    this.logger.debug('No rate limit configured, skipping rate limit check');
    return false;
  };

  protected dequeueWithRateLimitExec = (redisClient: IRedisClient) => {
    this.logger.debug('Executing dequeue after rate limit check');
    if (this.isPriorityQueuingEnabled()) {
      this.logger.debug('Using priority queue dequeue method');
      this.dequeueWithPriority(redisClient);
    } else {
      this.logger.debug('Using standard dequeue method');
      this.dequeueAndReturn(redisClient);
    }
  };

  protected dequeueWithPriority = (redisClient: IRedisClient): boolean => {
    if (this.isPriorityQueuingEnabled()) {
      this.logger.debug(
        `Dequeuing from priority queue: ${this.keyQueuePriorityPending} to ${this.keyQueueProcessing}`,
      );
      redisClient.zpoprpush(
        this.keyQueuePriorityPending,
        this.keyQueueProcessing,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndBlock = (redisClient: IRedisClient): boolean => {
    if (this.blockUntilMessageReceived) {
      this.logger.debug(
        `Blocking dequeue from ${this.keyQueuePending} to ${this.keyQueueProcessing}`,
      );
      redisClient.brpoplpush(
        this.keyQueuePending,
        this.keyQueueProcessing,
        0,
        this.handleMessage,
      );
      return true;
    }
    this.logger.debug('Blocking dequeue disabled, skipping');
    return false;
  };

  protected dequeueAndReturn = (redisClient: IRedisClient): void => {
    this.logger.debug(
      `Non-blocking dequeue from ${this.keyQueuePending} to ${this.keyQueueProcessing}`,
    );
    redisClient.rpoplpush(
      this.keyQueuePending,
      this.keyQueueProcessing,
      this.handleMessage,
    );
  };

  dequeue(): void {
    if (!this.isRunning()) {
      this.logger.debug('Dequeue called while not running, ignoring');
      return void 0;
    }

    this.logger.debug('Starting dequeue operation');

    if (this.isIdle()) {
      this.logger.debug(`Queue is idle, delaying dequeue for 1000ms`);
      this.resetIdle();
      return void this.timer.setTimeout(() => {
        this.dequeue();
      }, 1000);
    }

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error(
        `Failed to get Redis client instance: ${redisClient.message}`,
      );
      return this.handleError(redisClient);
    }

    this.logger.debug('Executing dequeue strategy');
    return void (
      this.dequeueWithRateLimit(redisClient) ||
      this.dequeueWithPriority(redisClient) ||
      this.dequeueAndBlock(redisClient) ||
      this.dequeueAndReturn(redisClient)
    );
  }
}
