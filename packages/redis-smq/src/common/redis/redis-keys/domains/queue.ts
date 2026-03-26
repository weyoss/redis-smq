/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../../queue-manager/index.js';
import { key } from '../builder.js';

const queuePath = (ns: string, queueName: string) => ['ns', ns, 'q', queueName];

const consumerGroupPath = (
  ns: string,
  queueName: string,
  consumerGroupId: string | null = null,
) =>
  consumerGroupId
    ? [...queuePath(ns, queueName), 'cgp', consumerGroupId]
    : queuePath(ns, queueName);

export const queue = {
  getQueueKeys(
    ns: string,
    queueName: string,
    consumerGroupId: string | null = null,
  ) {
    return {
      keyQueueProperties: key(...queuePath(ns, queueName), 'prop'),
      keyQueuePublished: key(...queuePath(ns, queueName), 'pub'),
      keyQueuePending: key(
        ...consumerGroupPath(ns, queueName, consumerGroupId),
        'pend',
      ),
      keyQueuePriority: key(
        ...consumerGroupPath(ns, queueName, consumerGroupId),
        'prio',
      ),
      keyQueueDeadLetter: key(...queuePath(ns, queueName), 'dl'),
      keyQueueProcessing: key(...queuePath(ns, queueName), 'proc'),
      keyQueueAcknowledged: key(...queuePath(ns, queueName), 'ack'),
      keyQueueScheduled: key(...queuePath(ns, queueName), 'sched'),
      keyQueueDelayed: key(...queuePath(ns, queueName), 'dly'),
      keyQueueRequeued: key(...queuePath(ns, queueName), 'req'),
      keyQueueConsumers: key(...queuePath(ns, queueName), 'cons'),
      keyQueueConsumerGroups: key(...queuePath(ns, queueName), 'cgp'),
      keyQueueStateHistory: key(...queuePath(ns, queueName), 'sh'),
      keyQueueExchangeBindings: key(...queuePath(ns, queueName), 'bind'),
      keyQueueProcessingQueues: key(...queuePath(ns, queueName), 'proc-q'),
      keyQueueWorkersLock: key(...queuePath(ns, queueName), 'wlock'),
      keyQueueRateLimit: key(...queuePath(ns, queueName), 'rate'),
    };
  },

  getQueueConsumerKeys(queue: IQueueParams, consumerId: string) {
    return {
      keyQueueProcessing: key(
        ...queuePath(queue.ns, queue.name),
        'cons',
        consumerId,
        'proc',
      ),
    };
  },
};
