import {
  EMessageUnacknowledgedCause,
  ICallback,
  TUnaryFunction,
} from '../../../types';
import { Base } from '../base';
import { Message } from '../message';
import { ConsumerRatesProvider } from './consumer-rates-provider';
import { events } from '../common/events';
import { Heartbeat } from './heartbeat';
import { RedisClient } from '../redis-client/redis-client';
import { resolve } from 'path';
import { ConsumerWorkers } from './consumer-workers';
import { WorkerRunner } from '../common/worker-runner';
import { ConsumerFrontend } from './consumer-frontend';

export class Consumer extends Base {
  private consumerRedisClient: RedisClient | null = null;
  private heartbeatRedisClient: RedisClient | null = null;
  private heartbeat: Heartbeat | null = null;
  private ratesProvider: ConsumerRatesProvider | null = null;
  private consumerWorkers: ConsumerWorkers | null = null;
  private consumerFrontend: ConsumerFrontend | null = null;

  private getConsumerRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.consumerRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.consumerRedisClient);
  }

  private getHeartbeat(cb: TUnaryFunction<Heartbeat>): void {
    if (!this.heartbeat)
      this.emit(events.ERROR, new Error('Expected an instance of Heartbeat'));
    else cb(this.heartbeat);
  }

  private handleConsume(msg: Message): void {
    if (!this.consumerFrontend || !this.consumerFrontend.consume) {
      throw new Error('Expected an instance of ConsumeHandler');
    }
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    this.logger.info(`Processing message [${msg.getId()}]...`);
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
        if (this.powerManager.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err)
            this.unacknowledgeMessage(
              msg,
              EMessageUnacknowledgedCause.UNACKNOWLEDGED,
              err,
            );
          else
            this.getBroker((broker) => {
              const { keyQueueProcessing } = this.redisKeys;
              broker.acknowledgeMessage(
                this.queueName,
                keyQueueProcessing,
                msg,
                (err) => {
                  if (err) this.emit(events.ERROR, err);
                  else {
                    this.logger.info(
                      `Message [${msg.getId()}] successfully processed`,
                    );
                    this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
                  }
                },
              );
            });
        }
      };

      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.consumerFrontend.consume(Message.createFromMessage(msg), onConsumed);
    } catch (error: unknown) {
      const err =
        error instanceof Error ? error : new Error(`Unexpected error`);
      this.unacknowledgeMessage(
        msg,
        EMessageUnacknowledgedCause.CAUGHT_ERROR,
        err,
      );
    }
  }

  private unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    this.getConsumerRedisClient((client) => {
      this.getBroker((broker) => {
        const { keyQueueProcessing } = this.redisKeys;
        broker.unacknowledgeMessage(
          client,
          this.queueName,
          keyQueueProcessing,
          msg,
          cause,
          err,
          (err) => {
            if (err) this.emit(events.ERROR, err);
            else this.emit(events.MESSAGE_UNACKNOWLEDGED, msg, cause);
          },
        );
      });
    });
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.UP, () => this.emit(events.MESSAGE_NEXT));
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.getConsumerRedisClient((client) => {
          this.logger.info('Waiting for new messages...');
          this.getBroker((broker) => {
            broker.dequeueMessage(client, this, (err, msgStr) => {
              if (err) this.emit(events.ERROR, err);
              else if (!msgStr)
                this.emit(
                  events.ERROR,
                  new Error('Expected a non empty string'),
                );
              else this.handleReceivedMessage(msgStr);
            });
          });
        });
      }
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, () => {
      if (this.ratesProvider) this.ratesProvider.incrementAcknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_UNACKNOWLEDGED, () => {
      if (this.ratesProvider) this.ratesProvider.incrementUnacknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
  }

  protected handleReceivedMessage(json: string): void {
    const message = Message.createFromMessage(json);
    this.emit(events.MESSAGE_DEQUEUED, message);
    if (message.hasExpired()) {
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgedCause.TTL_EXPIRED,
      );
    } else {
      this.logger.info(`Consuming message [${message.getId()}] ...`);
      if (this.ratesProvider) this.ratesProvider.incrementProcessingSlot();
      this.handleConsume(message);
    }
  }

  protected goingUp(): TUnaryFunction<ICallback<void>>[] {
    const setupConsumerRedisClient = (cb: ICallback<void>): void => {
      RedisClient.getNewInstance(this.config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new Error(`Expected an instance of RedisClient`));
        else {
          this.consumerRedisClient = client;
          cb();
        }
      });
    };
    const startHeartbeat = (cb: ICallback<void>) => {
      RedisClient.getNewInstance(this.config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new Error(`Expected an instance of RedisClient`));
        else {
          this.heartbeatRedisClient = client;
          this.heartbeat = new Heartbeat(this, client);
          cb();
        }
      });
    };
    const startConsumerWorkers = (cb: ICallback<void>) => {
      this.getSharedRedisClient((client) => {
        this.consumerWorkers = new ConsumerWorkers(
          resolve(`${__dirname}/../workers`),
          this.config,
          client,
          new WorkerRunner(),
        );
        this.consumerWorkers.on(events.ERROR, (err: Error) =>
          this.emit(events.ERROR, err),
        );
        cb();
      });
    };
    return super
      .goingUp()
      .concat([setupConsumerRedisClient, startHeartbeat, startConsumerWorkers]);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    const stopConsumerWorkers = (cb: ICallback<void>) => {
      this.consumerWorkers?.quit(() => {
        this.consumerWorkers = null;
        cb();
      });
    };
    const stopHeartbeat = (cb: ICallback<void>) => {
      this.getHeartbeat((heartbeat) => {
        heartbeat.quit(() => {
          this.heartbeatRedisClient?.halt(() => {
            this.heartbeatRedisClient = null;
            cb();
          });
        });
      });
    };
    const stopConsumerRedisClient = (cb: ICallback<void>) => {
      this.consumerRedisClient?.halt(() => {
        this.consumerRedisClient = null;
        cb();
      });
    };
    return [stopConsumerWorkers, stopHeartbeat, stopConsumerRedisClient].concat(
      super.goingDown(),
    );
  }

  getStatsProvider(): ConsumerRatesProvider {
    if (!this.ratesProvider) {
      this.ratesProvider = new ConsumerRatesProvider(this);
    }
    return this.ratesProvider;
  }

  setConsumerFrontend(consumerMessageHandler: ConsumerFrontend): Consumer {
    this.consumerFrontend = consumerMessageHandler;
    return this;
  }
}
