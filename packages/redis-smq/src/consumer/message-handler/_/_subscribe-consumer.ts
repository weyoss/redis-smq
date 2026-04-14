/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParsedParams,
  TQueueConsumer,
} from '../../../queue-manager/index.js';
import os from 'os';
import { ERedisScriptName } from '../../../common/redis/scripts.js';
import {
  QueueNotActiveError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../../../errors/index.js';
import { ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { withSharedPoolConnection } from '../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';

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

export function _subscribeConsumer(
  consumerId: string,
  queueParams: IQueueParsedParams,
  cb: ICallback,
) {
  withSharedPoolConnection((redisClient, done) => {
    const { queueParams: queue, groupId } = queueParams;
    const consumerInfo: TQueueConsumer = {
      ipAddress: IPAddresses,
      hostname: os.hostname(),
      pid: process.pid,
      createdAt: Date.now(),
    };

    const { keyQueueProcessingQueues, keyQueueConsumers, keyQueueProperties } =
      redisKeys.getQueueKeys(queue.ns, queue.name, groupId);
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue,
      consumerId,
    );
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);

    const keys = [
      keyQueueProperties,
      keyQueueConsumers,
      keyConsumerQueues,
      keyQueueProcessingQueues,
      keyQueueProcessing,
    ];

    if (groupId) {
      const { keyQueueConsumerGroupConsumers } =
        redisKeys.getQueueConsumerGroupKeys(queue, groupId);
      keys.push(keyQueueConsumerGroupConsumers);
    }

    const args = [
      consumerId,
      JSON.stringify(consumerInfo),
      JSON.stringify(queue),
      // Operational state constants (ARGV[4-5])
      EQueueProperty.OPERATIONAL_STATE,
      EQueueOperationalState.ACTIVE,
    ];

    redisClient.runScript(
      ERedisScriptName.SUBSCRIBE_CONSUMER,
      keys,
      args,
      (err, reply) => {
        if (err) return done(err);
        if (reply === 'QUEUE_NOT_FOUND')
          return done(
            new QueueNotFoundError({
              metadata: {
                queue: queue,
              },
            }),
          );
        if (reply === 'QUEUE_NOT_ACTIVE')
          return done(
            new QueueNotActiveError({
              metadata: { queue },
            }),
          );
        if (reply === 'OK') return done();
        done(new UnexpectedScriptReplyError({ metadata: { reply } }));
      },
    );
  }, cb);
}
