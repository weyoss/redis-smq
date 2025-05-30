/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { Message } from '../../message/index.js';
import { QueueMessagesManagerAbstract } from '../queue-messages-manager/queue-messages-manager-abstract.js';
import { QueueMessagesStorageList } from '../queue-messages-storage/queue-messages-storage-list.js';

/**
 * Manages acknowledged messages in a queue.
 *
 * Acknowledged messages are those that have been successfully processed by consumers
 * and can be safely removed from the active queue. This class allows for tracking
 * and management of these messages when the system is configured to store them.
 *
 * @extends QueueMessagesManagerAbstract
 * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/configuration.md#message-storage
 */
export class QueueAcknowledgedMessages extends QueueMessagesManagerAbstract {
  constructor() {
    const redisClient = new RedisClient();
    super(
      redisClient,
      new QueueMessagesStorageList(redisClient),
      new Message(),
      'keyQueueAcknowledged',
    );
    this.logger.debug('QueueAcknowledgedMessages initialized');
  }
}
