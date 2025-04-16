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
import { QueueMessagesStorageList } from '../queue-messages-storage/queue-message-storage-list.js';

export class QueueDeadLetteredMessages extends QueueMessagesManagerAbstract {
  constructor() {
    const redisClient = new RedisClient();
    super(
      redisClient,
      new QueueMessagesStorageList(redisClient),
      new Message(),
      'keyQueueDL',
    );
  }
}
