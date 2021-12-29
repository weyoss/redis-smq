import { Broker } from '../broker';
import {
  ICallback,
  IConfig,
  TFunction,
  TQueueParams,
  TUnaryFunction,
} from '../../../types';
import { Message } from '../message';
import { events } from '../common/events';
import { PanicError } from '../common/errors/panic.error';
import { PowerManager } from '../common/power-manager/power-manager';
import { EventEmitter } from 'events';
import { MultiQueueProducerMessageRate } from './multi-queue-producer-message-rate';
import { v4 as uuid } from 'uuid';
import { Logger } from '../common/logger';
import { redisKeys } from '../common/redis-keys/redis-keys';
import * as BunyanLogger from 'bunyan';
import { MessageManager } from '../message-manager/message-manager';
import { RedisClient } from '../redis-client/redis-client';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import * as async from 'async';
import { QueueManager } from '../queue-manager/queue-manager';

export class MultiQueueProducer extends EventEmitter {
  protected readonly id: string;
  protected readonly config: IConfig;
  protected readonly logger: BunyanLogger;
  protected readonly powerManager: PowerManager;

  protected messageRate: MultiQueueProducerMessageRate | null = null;
  protected sharedRedisClient: RedisClient | null = null;
  protected broker: Broker | null = null;
  protected heartbeat: Heartbeat | null = null;
  protected queues = new Set<string>();

  constructor(config: IConfig) {
    super();
    if (config.namespace) {
      redisKeys.setNamespace(config.namespace);
    }
    this.id = uuid();
    this.config = config;
    this.powerManager = new PowerManager();
    this.logger = Logger(this.constructor.name, {
      ...this.config.log,
      options: {
        ...this.config.log?.options,
        producerId: this.getId(),
      },
    });
    this.registerEventsHandlers();
    Message.setDefaultOptions(config.message);
    this.run();
  }

  protected registerEventsHandlers(): void {
    this.on(events.GOING_UP, () => this.logger.info(`Starting up...`));
    this.on(events.UP, () => this.logger.info(`Up and running...`));
    this.on(events.GOING_DOWN, () => this.logger.info(`Shutting down...`));
    this.on(events.DOWN, () => this.logger.info(`Shutdown.`));
    this.on(events.ERROR, (err: Error) => this.handleError(err));
  }

  protected handleError(err: Error): void {
    if (this.powerManager.isGoingUp() || this.powerManager.isRunning()) {
      throw err;
    }
  }

  private setUpSharedRedisClient = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up shared RedisClient instance...`);
    RedisClient.getNewInstance(this.config, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new EmptyCallbackReplyError());
      else {
        this.sharedRedisClient = client;
        cb();
      }
    });
  };

  private setUpBroker = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up Broker instance...`);
    if (!this.sharedRedisClient)
      cb(new PanicError(`Expected an instance of RedisClient`));
    else {
      const messageManager = new MessageManager(
        this.sharedRedisClient,
        this.logger,
      );
      this.broker = new Broker(this.config, messageManager, this.logger);
      cb();
    }
  };

  private setUpMessageRate = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up MessageRate...`);
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      if (!this.sharedRedisClient)
        cb(new PanicError(`Expected an instance of RedisClient`));
      else {
        this.messageRate = new MultiQueueProducerMessageRate(
          this.getId(),
          this.sharedRedisClient,
        );
        cb();
      }
    } else {
      this.logger.debug(`Skipping MessageRate setup as monitor not enabled...`);
      cb();
    }
  };

  private setUpHeartbeat = (cb: ICallback<void>) => {
    this.logger.debug(`Set up consumer heartbeat...`);
    RedisClient.getNewInstance(this.config, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new EmptyCallbackReplyError());
      else {
        const { keyHeartbeatMultiQueueProducer, keyMultiQueueProducers } =
          redisKeys.getMultiQueueProducerKeys(this.getId());
        const heartbeat = new Heartbeat(
          {
            keyHeartbeat: keyHeartbeatMultiQueueProducer,
            keyInstanceRegistry: keyMultiQueueProducers,
            instanceId: this.getId(),
          },
          client,
        );
        heartbeat.on(events.ERROR, (err: Error) =>
          this.emit(events.ERROR, err),
        );
        this.heartbeat = heartbeat;
        cb();
      }
    });
  };

  private tearDownSharedRedisClient = (cb: ICallback<void>) => {
    this.logger.debug(`Tear down shared RedisClient instance...`);
    if (this.sharedRedisClient) {
      this.sharedRedisClient.halt(() => {
        this.logger.debug(`Shared RedisClient instance has been torn down.`);
        this.sharedRedisClient = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.sharedRedisClient] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  private tearDownMessageRate = (cb: ICallback<void>) => {
    this.logger.debug(`Tear down MessageRate...`);
    if (this.messageRate) {
      this.messageRate.quit(() => {
        this.logger.debug(`MessageRate has been torn down.`);
        this.messageRate = null;
        cb();
      });
    } else cb();
  };

  private tearDownBroker = (cb: ICallback<void>): void => {
    this.logger.debug(`Tear down Broker instance...`);
    if (this.broker) {
      this.broker.quit(() => {
        this.logger.debug(`Broker instance has been torn down.`);
        this.broker = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.broker] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  private tearDownHeartbeat = (cb: ICallback<void>) => {
    this.logger.debug(`Tear down consumer heartbeat...`);
    if (this.heartbeat) {
      this.heartbeat.quit(() => {
        this.logger.debug(`Consumer heartbeat has been torn down.`);
        this.heartbeat = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.heartbeat] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  protected getBroker(cb: TUnaryFunction<Broker>): void {
    if (!this.broker)
      this.emit(events.ERROR, new PanicError('Expected an instance of Broker'));
    else cb(this.broker);
  }

  protected getSharedRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.sharedRedisClient)
      this.emit(
        events.ERROR,
        new PanicError('Expected an instance of RedisClient'),
      );
    else cb(this.sharedRedisClient);
  }

  protected goingUp(): TFunction[] {
    return [
      this.setUpSharedRedisClient,
      this.setUpHeartbeat,
      this.setUpBroker,
      this.setUpMessageRate,
    ];
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [
      this.tearDownHeartbeat,
      this.tearDownBroker,
      this.tearDownMessageRate,
      this.tearDownSharedRedisClient,
    ];
  }

  getId(): string {
    return this.id;
  }

  produce(queueName: string, msg: unknown, cb: ICallback<boolean>): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: redisKeys.getNamespace(),
    };
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    message.reset();
    message.setQueue(queue);
    const callback: ICallback<boolean> = (err, reply) => {
      if (err) cb(err);
      else {
        if (this.messageRate) this.messageRate.incrementPublished(queue);
        this.emit(events.MESSAGE_PRODUCED, message);
        cb(null, reply);
      }
    };
    const proceed = () => {
      this.getBroker((broker) => {
        if (message.isSchedulable()) {
          broker.scheduleMessage(message, callback);
        } else {
          broker.enqueueMessage(message, (err?: Error | null) => {
            if (err) callback(err);
            else callback(null, true);
          });
        }
      });
    };
    const setUpQueue = (): void => {
      const queueId = `${queue.ns}:${queue.name}`;
      if (!this.queues.has(queueId)) {
        this.getSharedRedisClient((redisClient) => {
          QueueManager.setUpMessageQueue(queue, redisClient, (err) => {
            if (err) cb(err);
            else {
              this.queues.add(queueId);
              proceed();
            }
          });
        });
      } else proceed();
    };
    if (!this.powerManager.isUp()) {
      if (this.powerManager.isGoingUp()) {
        this.once(events.UP, setUpQueue);
      } else {
        cb(new PanicError(`Producer ID ${this.getId()} is not running`));
      }
    } else setUpQueue();
  }

  run(cb?: ICallback<void>): void {
    this.powerManager.goingUp();
    this.emit(events.GOING_UP);
    const tasks = this.goingUp();
    async.waterfall(tasks, () => {
      this.powerManager.commit();
      this.emit(events.UP);
      cb && cb();
    });
  }

  shutdown(cb?: ICallback<void>): void {
    this.powerManager.goingDown();
    this.emit(events.GOING_DOWN);
    const tasks = this.goingDown();
    async.waterfall(tasks, () => {
      this.powerManager.commit();
      this.emit(events.DOWN);
      cb && cb();
    });
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  isGoingUp(): boolean {
    return this.powerManager.isGoingUp();
  }

  isGoingDown(): boolean {
    return this.powerManager.isGoingDown();
  }

  isUp(): boolean {
    return this.powerManager.isUp();
  }

  isDown(): boolean {
    return this.powerManager.isDown();
  }
}
