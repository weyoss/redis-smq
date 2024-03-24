/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { EMessagePropertyStatus } from '../message/index.js';
import { IQueueParams } from '../queue/index.js';
import { _requeueMessage } from './_/_requeue-message.js';
import { QueueMessagesPaginatorList } from './queue-messages-paginator/queue-messages-paginator-list.js';
import { IQueueMessagesRequeuable } from './types/index.js';

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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _requeueMessage(
          client,
          queue,
          messageId,
          EMessagePropertyStatus.DEAD_LETTERED,
          cb,
        );
    });
  }
}
