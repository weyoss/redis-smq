/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Exchange } from './exchange';
import {
  EExchangeType,
  EQueueProperty,
  IQueueParams,
  IQueueProperties,
  TExchangeFanOutBindingParams,
} from '../../../types';
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { _getFanOutExchangeQueues } from './_get-fan-out-exchange-queues';
import { ExchangeError, ExchangeFanOutError } from './errors';
import { _parseQueueParams } from '../queue/queue/_parse-queue-params';
import { _getQueueProperties } from '../queue/queue/_get-queue-properties';
import { _getQueueFanOutExchange } from './_get-queue-fan-out-exchange';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class ExchangeFanOut extends Exchange<
  TExchangeFanOutBindingParams,
  EExchangeType.FANOUT
> {
  constructor(fanOutName: TExchangeFanOutBindingParams) {
    super(fanOutName, EExchangeType.FANOUT);
  }

  protected override validateBindingParams(
    bindingParams: TExchangeFanOutBindingParams,
  ): string {
    const fanOutName = redisKeys.validateRedisKey(bindingParams);
    if (fanOutName instanceof Error) throw fanOutName;
    return fanOutName;
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
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
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      const { keyQueues, keyQueueProperties } = redisKeys.getQueueKeys(
        queueParams,
        null,
      );
      const { keyExchanges, keyExchangeBindings } =
        redisKeys.getFanOutExchangeKeys(exchangeParams);
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
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
                queueProperties: IQueueProperties,
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
                        (err, exchangeQueueProperties) => {
                          if (err) cb(err);
                          else if (!exchangeQueueProperties)
                            cb(new CallbackEmptyReplyError());
                          else if (
                            exchangeQueueProperties.queueType !==
                            queueProperties.queueType
                          )
                            cb(
                              new ExchangeFanOutError(
                                'Binding different types of queues to the same exchange is not allowed.',
                              ),
                            );
                          else cb(null, queueProperties);
                        },
                      );
                    else cb(null, queueProperties);
                  }
                }),
              (queueProperties: IQueueProperties, cb: ICallback<void>) => {
                const currentExchangeParams = queueProperties.exchange;
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
  }

  unbindQueue(queue: IQueueParams | string, cb: ICallback<void>): void {
    const exchangeName = this.getBindingParams();
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      const { keyQueues, keyQueueProperties } = redisKeys.getQueueKeys(
        queueParams,
        null,
      );
      const { keyExchangeBindings } =
        redisKeys.getFanOutExchangeKeys(exchangeName);
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          async.waterfall(
            [
              (cb: ICallback<void>) =>
                client.watch(
                  [keyQueues, keyQueueProperties, keyExchangeBindings],
                  (err) => cb(err),
                ),
              (cb: ICallback<IQueueProperties>) =>
                _getQueueProperties(client, queueParams, (err, properties) => {
                  if (err) cb(err);
                  else if (!properties) cb(new CallbackEmptyReplyError());
                  else if (properties.exchange !== exchangeName)
                    cb(
                      new ExchangeFanOutError(
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
  }

  static getAllExchanges(cb: ICallback<string[]>): void {
    const { keyExchanges } = redisKeys.getMainKeys();
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else client.sscanAll(keyExchanges, {}, cb);
    });
  }

  static getQueueExchange(
    queue: IQueueParams | string,
    cb: ICallback<ExchangeFanOut | null>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          _getQueueFanOutExchange(client, queueParams, cb);
        }
      });
    }
  }
}
