import {
  EQueueSettingType,
  IConfig,
  IRequiredConfig,
  TQueueParams,
  TQueueSettings,
} from '../../../types';
import {
  async,
  createClientInstance,
  errors,
  logger,
  RedisClient,
} from 'redis-smq-common';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';
import { FanOutExchange } from './fan-out-exchange';
import { Queue } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { getConfiguration } from '../../config/configuration';
import { ExchangeError } from './errors/exchange.error';

export class FanOutExchangeManager {
  protected config: IRequiredConfig;
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  protected constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  saveExchange(exchange: FanOutExchange, cb: ICallback<void>): void {
    const { keyExchanges } = redisKeys.getMainKeys();
    this.redisClient.sadd(keyExchanges, exchange.getBindingParams(), (err) =>
      cb(err),
    );
  }

  deleteExchange(exchange: FanOutExchange, cb: ICallback<void>): void {
    const { keyExchanges, keyExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(exchange.getBindingParams());
    this.redisClient.watch([keyExchanges, keyExchangeBindings], (err) => {
      if (err) cb(err);
      else {
        this.getExchangeQueues(exchange, (err, reply = []) => {
          if (err) cb(err);
          else if (reply.length)
            cb(
              new ExchangeError(
                `Exchange has ${reply.length} bound queue(s). Unbind all queues before deleting the exchange.`,
              ),
            );
          else {
            const multi = this.redisClient.multi();
            multi.srem(keyExchanges, exchange.getBindingParams());
            multi.del(keyExchangeBindings);
            multi.exec((err) => cb(err));
          }
        });
      }
    });
  }

  bindQueue(
    queue: TQueueParams | string,
    exchange: FanOutExchange,
    cb: ICallback<void>,
  ): void {
    async.waterfall(
      [
        (cb: ICallback<TQueueSettings>) =>
          Queue.getSettings(this.config, this.redisClient, queue, cb),
        (queueSettings: TQueueSettings, cb: ICallback<void>) => {
          const exchangeParams = exchange.getBindingParams();
          const currentExchangeParams = queueSettings.exchange;
          if (currentExchangeParams === exchangeParams) cb();
          else {
            const { keyExchanges, keyExchangeBindings } =
              redisKeys.getFanOutExchangeKeys(exchangeParams);
            const queueParams = Queue.getParams(this.config, queue);
            const { keyQueues, keyQueueSettings } =
              redisKeys.getQueueKeys(queueParams);
            this.redisClient.watch(
              [keyQueues, keyQueueSettings, keyExchangeBindings],
              (err) => {
                if (err) cb(err);
                else {
                  const multi = this.redisClient.multi();
                  const queueParamsStr = JSON.stringify(queueParams);
                  multi.sadd(keyExchanges, exchangeParams);
                  multi.sadd(keyExchangeBindings, queueParamsStr);
                  multi.hset(
                    keyQueueSettings,
                    EQueueSettingType.EXCHANGE,
                    exchangeParams,
                  );
                  if (currentExchangeParams) {
                    const { keyExchangeBindings } =
                      redisKeys.getFanOutExchangeKeys(currentExchangeParams);
                    multi.srem(keyExchangeBindings, queueParamsStr);
                  }
                  multi.exec((err) => cb(err));
                }
              },
            );
          }
        },
      ],
      (err) => {
        if (err) this.redisClient.unwatch(() => cb(err));
        else cb();
      },
    );
  }

  unbindQueue(
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
          const { keyQueues, keyQueueSettings } =
            redisKeys.getQueueKeys(queueParams);
          this.redisClient.watch(
            [keyQueues, keyQueueSettings, keyExchangeBindings],
            (err) => {
              if (err) cb(err);
              else {
                const multi = this.redisClient.multi();
                const queueParamsStr = JSON.stringify(queueParams);
                multi.srem(keyExchangeBindings, queueParamsStr);
                multi.hdel(keyQueueSettings, EQueueSettingType.EXCHANGE);
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

  getExchanges(cb: ICallback<string[]>): void {
    const { keyExchanges } = redisKeys.getMainKeys();
    this.redisClient.sscanFallback(keyExchanges, cb);
  }

  getExchangeQueues(
    exchange: FanOutExchange,
    cb: ICallback<TQueueParams[]>,
  ): void {
    FanOutExchangeManager.getExchangeQueues(this.redisClient, exchange, cb);
  }

  getQueueExchange(
    queue: TQueueParams | string,
    cb: ICallback<string | null>,
  ): void {
    FanOutExchangeManager.getQueueExchange(
      this.config,
      this.redisClient,
      queue,
      cb,
    );
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(cb);
  }

  static getExchangeQueues(
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

  static getQueueExchange(
    config: IRequiredConfig,
    redisClient: RedisClient,
    queue: TQueueParams | string,
    cb: ICallback<string | null>,
  ): void {
    Queue.getSettings(config, redisClient, queue, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply?.exchange);
    });
  }

  static createInstance(
    config: IConfig = {},
    cb: ICallback<FanOutExchangeManager>,
  ): void {
    const cfg = getConfiguration(config);
    const redis = cfg.redis;
    createClientInstance(redis, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const loggerCfg = cfg.logger;
        const nsLogger = logger.getNamespacedLogger(loggerCfg, 'queue-manager');
        const fanOutExchangeManager = new FanOutExchangeManager(
          cfg,
          client,
          nsLogger,
        );
        cb(null, fanOutExchangeManager);
      }
    });
  }
}
