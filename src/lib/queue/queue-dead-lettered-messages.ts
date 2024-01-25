/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessagePropertyStatus,
  IQueueMessagesRequeuable,
  IQueueParams,
} from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueMessagesPaginatorList } from './queue-messages-paginator/queue-messages-paginator-list';
import { ICallback } from 'redis-smq-common';
import { _requeueMessage } from './_requeue-message';

export class QueueDeadLetteredMessages
  extends QueueMessagesPaginatorList
  implements IQueueMessagesRequeuable
{
  protected redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys> =
    'keyQueueDL';

  requeueMessage(
    queue: string | IQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    _requeueMessage(queue, messageId, EMessagePropertyStatus.DEAD_LETTERED, cb);
  }
}
