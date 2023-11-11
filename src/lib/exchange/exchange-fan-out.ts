import { Exchange } from './exchange';
import {
  EExchangeType,
  EQueueProperty,
  TExchangeFanOutExchangeBindingParams,
  IQueueParams,
  IQueueProperties,
} from '../../../types';
import { async, errors, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { _getFanOutExchangeQueues } from './_get-fan-out-exchange-queues';
import { ExchangeError } from './errors/exchange.error';
import { _getQueueParams } from '../queue/queue/_get-queue-params';
import { _getQueueProperties } from '../queue/queue/_get-queue-properties';
import { FanOutExchangeQueueError } from './errors/fan-out-exchange-queue.error';
import { _getQueueFanOutExchange } from './_get-queue-fan-out-exchange';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class ExchangeFanOut extends Exchange<
  TExchangeFanOutExchangeBindingParams,
  EExchangeType.FANOUT
> {
  constructor(queue: TExchangeFanOutExchangeBindingParams) {
    super(queue, EExchangeType.FANOUT);
  }

  protected override validateBindingParams(
    bindingParams: TExchangeFanOutExchangeBindingParams,
  ): string {
    return redisKeys.validateRedisKey(bindingParams);
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else _getFanOutExchangeQueues(client, this, cb);
    });
  }

  saveExchange(cb: ICallback<void>): void {
    const { keyExchanges } = redisKeys.getMainKeys();
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else {
        client?.sadd(keyExchanges, this.getBindingParams(), (err) => cb(err));
      }
    });
  }

  deleteExchange(cb: ICallback<void>): void {
    const { keyExchanges, keyExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(this.getBindingParams());
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else {
        client?.watch([keyExchanges, keyExchangeBindings], (err) => {
          if (err) cb(err);
          else {
            this.getQueues((err, reply = []) => {
              if (err) cb(err);
              else if (reply.length)
                cb(
                  new ExchangeError(
                    `Exchange has ${reply.length} bound queue(s). Unbind all queues before deleting the exchange.`,
                  ),
                );
              else {
                const multi = client.multi();
                multi.srem(keyExchanges, this.getBindingParams());
                multi.del(keyExchangeBindings);
                multi.exec((err) => cb(err));
              }
            });
          }
        });
      }
    });
  }

  bindQueue(queue: IQueueParams | string, cb: ICallback<void>): void {
    const exchangeParams = this.getBindingParams();
    const queueParams = _getQueueParams(queue);
    const { keyQueues, keyQueueProperties } =
      redisKeys.getQueueKeys(queueParams);
    const { keyExchanges, keyExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(exchangeParams);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        async.waterfall(
          [
            (cb: ICallback<void>) =>
              client.watch(
                [keyQueues, keyQueueProperties, keyExchangeBindings],
                (err) => cb(err),
              ),
            (cb: ICallback<IQueueProperties>) =>
              _getQueueProperties(client, queueParams, cb),
            (
              queueSettings: IQueueProperties,
              cb: ICallback<IQueueProperties>,
            ) =>
              this.getQueues((err, queues) => {
                if (err) cb(err);
                else {
                  const eQueue = queues?.pop();
                  if (eQueue)
                    _getQueueProperties(
                      client,
                      eQueue,
                      (err, exchangeQueueSetting) => {
                        if (err) cb(err);
                        else if (!exchangeQueueSetting)
                          cb(new errors.EmptyCallbackReplyError());
                        else if (
                          exchangeQueueSetting[EQueueProperty.QUEUE_TYPE] !==
                          queueSettings[EQueueProperty.QUEUE_TYPE]
                        )
                          cb(new FanOutExchangeQueueError());
                        else cb(null, queueSettings);
                      },
                    );
                  else cb(null, queueSettings);
                }
              }),
            (queueSettings: IQueueProperties, cb: ICallback<void>) => {
              const currentExchangeParams =
                queueSettings[EQueueProperty.EXCHANGE];
              if (currentExchangeParams === exchangeParams) cb();
              else {
                const multi = client.multi();
                const queueParamsStr = JSON.stringify(queueParams);
                multi.sadd(keyExchanges, exchangeParams);
                multi.sadd(keyExchangeBindings, queueParamsStr);
                multi.hset(
                  keyQueueProperties,
                  String(EQueueProperty.EXCHANGE),
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
          ],
          (err) => {
            if (err) client.unwatch(() => cb(err));
            else cb();
          },
        );
      }
    });
  }

  unbindQueue(queue: IQueueParams | string, cb: ICallback<void>): void {
    const exchangeName = this.getBindingParams();
    const queueParams = _getQueueParams(queue);
    const { keyQueues, keyQueueProperties } =
      redisKeys.getQueueKeys(queueParams);
    const { keyExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(exchangeName);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        async.waterfall(
          [
            (cb: ICallback<void>) =>
              client.watch(
                [keyQueues, keyQueueProperties, keyExchangeBindings],
                (err) => cb(err),
              ),
            (cb: ICallback<IQueueProperties>) =>
              _getQueueProperties(client, queueParams, (err, settings) => {
                if (err) cb(err);
                else if (!settings) cb(new errors.EmptyCallbackReplyError());
                else if (settings[EQueueProperty.EXCHANGE] !== exchangeName)
                  cb(
                    new ExchangeError(
                      `Queue ${queueParams.name}@${queueParams.ns} is not bound to [${exchangeName}] exchange.`,
                    ),
                  );
                else cb();
              }),
            (cb: ICallback<void>) => {
              const multi = client.multi();
              const queueParamsStr = JSON.stringify(queueParams);
              multi.srem(keyExchangeBindings, queueParamsStr);
              multi.hdel(keyQueueProperties, String(EQueueProperty.EXCHANGE));
              multi.exec((err) => cb(err));
            },
          ],
          (err) => {
            if (err) client.unwatch(() => cb(err));
            else cb();
          },
        );
      }
    });
  }

  static getAllExchanges(cb: ICallback<string[]>): void {
    const { keyExchanges } = redisKeys.getMainKeys();
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else client.sscanAll(keyExchanges, {}, cb);
    });
  }

  static getQueueExchange(
    queue: IQueueParams | string,
    cb: ICallback<ExchangeFanOut | null>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        _getQueueFanOutExchange(client, queueParams, cb);
      }
    });
  }
}
