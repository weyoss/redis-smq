import { FanOutExchange } from '../exchange/fan-out.exchange';
import { IRequiredConfig, TQueueParams, TQueueSettings } from '../../../types';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';
import { async, RedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { Queue } from './queue';

export class QueueExchange {
  protected config: IRequiredConfig;
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  bindQueueToExchange(
    exchange: FanOutExchange,
    queue: TQueueParams | string,
    cb: ICallback<void>,
  ): void {
    async.waterfall(
      [
        (cb: ICallback<TQueueSettings>) =>
          Queue.getSettings(this.config, this.redisClient, queue, cb),
        (queueSettings: TQueueSettings, cb: ICallback<void>) => {
          const { keyExchangeBindings } = redisKeys.getFanOutExchangeKeys(
            exchange.getBindingParams(),
          );
          const queueParams = Queue.getParams(this.config, queue);
          const {
            keyQueues,
            keyQueueSettings,
            keyQueueSettingsExchangeBinding,
          } = redisKeys.getQueueKeys(queueParams);
          this.redisClient.watch(
            [keyQueues, keyQueueSettings, keyExchangeBindings],
            (err) => {
              if (err) cb(err);
              else {
                const multi = this.redisClient.multi();
                const queueParamsStr = JSON.stringify(queueParams);
                multi.sadd(keyExchangeBindings, queueParamsStr);
                multi.hset(
                  keyQueueSettings,
                  keyQueueSettingsExchangeBinding,
                  exchange.getBindingParams(),
                );
                multi.exec((err) => cb(err));
              }
            },
          );
        },
      ],
      (err) => {
        if (err) this.redisClient.unwatch(() => cb(err));
        else cb();
      },
    );
  }

  unbindQueueFromExchange(
    queue: TQueueParams | string,
    exchange: FanOutExchange,
    cb: ICallback<void>,
  ): void {
    async.waterfall(
      [
        (cb: ICallback<TQueueSettings>) =>
          Queue.getSettings(this.config, this.redisClient, queue, cb),
        (queueSettings: TQueueSettings, cb: ICallback<void>) => {
          const { keyExchangeBindings } = redisKeys.getFanOutExchangeKeys(
            exchange.getBindingParams(),
          );
          const queueParams = Queue.getParams(this.config, queue);
          const {
            keyQueues,
            keyQueueSettings,
            keyQueueSettingsExchangeBinding,
          } = redisKeys.getQueueKeys(queueParams);
          this.redisClient.watch(
            [keyQueues, keyQueueSettings, keyExchangeBindings],
            (err) => {
              if (err) cb(err);
              else {
                const multi = this.redisClient.multi();
                const queueParamsStr = JSON.stringify(queueParams);
                multi.srem(keyExchangeBindings, queueParamsStr);
                multi.hdel(keyQueueSettings, keyQueueSettingsExchangeBinding);
                multi.exec((err) => cb(err));
              }
            },
          );
        },
      ],
      (err) => {
        if (err) this.redisClient.unwatch(() => cb(err));
        else cb();
      },
    );
  }

  getExchangeBindings(
    exchange: FanOutExchange,
    cb: ICallback<TQueueParams[]>,
  ): void {
    QueueExchange.getExchangeBindings(this.redisClient, exchange, cb);
  }

  getQueueExchangeBinding(
    queue: TQueueParams | string,
    cb: ICallback<string>,
  ): void {
    QueueExchange.getQueueExchangeBinding(
      this.config,
      this.redisClient,
      queue,
      cb,
    );
  }

  static getExchangeBindings(
    redisClient: RedisClient,
    exchange: FanOutExchange,
    cb: ICallback<TQueueParams[]>,
  ): void {
    const { keyExchangeBindings } = redisKeys.getFanOutExchangeKeys(
      exchange.getBindingParams(),
    );
    redisClient.sscanFallback(keyExchangeBindings, (err, reply) => {
      if (err) cb(err);
      else {
        const queues: TQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
        cb(null, queues);
      }
    });
  }

  static getQueueExchangeBinding(
    config: IRequiredConfig,
    redisClient: RedisClient,
    queue: TQueueParams | string,
    cb: ICallback<string>,
  ): void {
    Queue.getSettings(config, redisClient, queue, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply?.exchangeBinding);
    });
  }
}
