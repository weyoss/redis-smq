/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { QueueMessagesPaginatorList } from './queue-messages-paginator/queue-messages-paginator-list.js';

export class QueueDeadLetteredMessages extends QueueMessagesPaginatorList {
  protected redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys> =
    'keyQueueDL';
}
