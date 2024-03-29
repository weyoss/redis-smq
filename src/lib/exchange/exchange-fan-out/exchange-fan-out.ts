/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getQueueProperties } from '../../queue/_/_get-queue-properties.js';
import { _parseQueueParams } from '../../queue/_/_parse-queue-params.js';
import {
  EQueueProperty,
  IQueueParams,
  IQueueProperties,
} from '../../queue/index.js';
import { ExchangeFanOutError } from '../errors/index.js';
import { ExchangeError } from '../errors/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { _getFanOutExchangeQueues } from './_/_get-fan-out-exchange-queues.js';
import { _getQueueFanOutExchange } from './_/_get-queue-fan-out-exchange.js';
import { _validateExchangeFanOutParams } from './_/_validate-exchange-fan-out-params.js';

export class ExchangeFanOut extends ExchangeAbstract<string> {
  getQueues(exchangeParams: string, cb: ICallback<IQueueParams[]>): void {
    const fanOutName = _validateExchangeFanOutParams(exchangeParams);
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getFanOutExchangeQueues(client, fanOutName, cb);
    });
  }

  saveExchange(exchangeParams: string, cb: ICallback<void>): void {
    const fanOutName = redisKeys.validateRedisKey(exchangeParams);
    if (fanOutName instanceof Error) cb(fanOutName);
    else {
      const { keyFanOutExchanges } = redisKeys.getMainKeys();
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else {
          client?.sadd(keyFanOutExchanges, fanOutName, (err) => cb(err));
        }
      });
    }
  }

  deleteExchange(exchangeParams: string, cb: ICallback<void>): void {
    const fanOutName = redisKeys.validateRedisKey(exchangeParams);
    if (fanOutName instanceof Error) cb(fanOutName);
    else {
      const { keyExchangeBindings } =
        redisKeys.getFanOutExchangeKeys(fanOutName);
      const { keyFanOutExchanges } = redisKeys.getMainKeys();
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else {
          client?.watch([keyFanOutExchanges, keyExchangeBindings], (err) => {
            if (err) cb(err);
            else {
              _getFanOutExchangeQueues(
                client,
                fanOutName,
                (err, reply = []) => {
                  if (err) cb(err);
                  else if (reply.length)
                    cb(
                      new ExchangeError(
                        `Exchange has ${reply.length} bound queue(s). Unbind all queues before deleting the exchange.`,
                      ),
                    );
                  else {
                    const multi = client.multi();
                    multi.srem(keyFanOutExchanges, fanOutName);
                    multi.del(keyExchangeBindings);
                    multi.exec((err) => cb(err));
                  }
                },
              );
            }
          });
        }
      });
    }
  }

  bindQueue(
    queue: IQueueParams | string,
    exchangeParams: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const fanOutName = redisKeys.validateRedisKey(exchangeParams);
    if (queueParams instanceof Error) cb(queueParams);
    else if (fanOutName instanceof Error) cb(fanOutName);
    else {
      const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
      const { keyExchangeBindings } =
        redisKeys.getFanOutExchangeKeys(fanOutName);
      const { keyQueues, keyFanOutExchanges } = redisKeys.getMainKeys();
      this.redisClient.getSetInstance((err, client) => {
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
                _getFanOutExchangeQueues(client, fanOutName, (err, queues) => {
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
                if (currentExchangeParams === fanOutName) cb();
                else {
                  const multi = client.multi();
                  const queueParamsStr = JSON.stringify(queueParams);
                  multi.sadd(keyFanOutExchanges, fanOutName);
                  multi.sadd(keyExchangeBindings, queueParamsStr);
                  multi.hset(
                    keyQueueProperties,
                    String(EQueueProperty.EXCHANGE),
                    fanOutName,
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

  unbindQueue(
    queue: IQueueParams | string,
    exchangeParams: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const fanOutName = redisKeys.validateRedisKey(exchangeParams);
    if (queueParams instanceof Error) cb(queueParams);
    else if (fanOutName instanceof Error) cb(fanOutName);
    else {
      const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
      const { keyQueues } = redisKeys.getMainKeys();
      const { keyExchangeBindings } =
        redisKeys.getFanOutExchangeKeys(fanOutName);
      this.redisClient.getSetInstance((err, client) => {
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
                  else if (properties.exchange !== fanOutName)
                    cb(
                      new ExchangeFanOutError(
                        `Queue ${queueParams.name}@${queueParams.ns} is not bound to [${fanOutName}] exchange.`,
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

  getAllExchanges(cb: ICallback<string[]>): void {
    const { keyFanOutExchanges } = redisKeys.getMainKeys();
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else client.sscanAll(keyFanOutExchanges, {}, cb);
    });
  }

  getQueueExchange(
    queue: IQueueParams | string,
    cb: ICallback<string | null>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _getQueueFanOutExchange(client, queueParams, cb);
      });
    }
  }
}
