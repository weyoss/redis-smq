/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getMessage } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';
import { Worker } from './worker.js';

class RequeueUnacknowledgedWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    const { keyQueueRequeued, keyQueueProperties } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    redisClient.lrange(keyQueueRequeued, 0, 99, (err, reply) => {
      if (err) cb(err);
      else {
        const messageIds = reply ?? [];
        if (messageIds.length) {
          const keys: string[] = [keyQueueRequeued, keyQueueProperties];
          const argv: (string | number)[] = [
            EQueueProperty.QUEUE_TYPE,
            EQueueType.PRIORITY_QUEUE,
            EQueueType.LIFO_QUEUE,
            EQueueType.FIFO_QUEUE,
            EMessageProperty.STATUS,
            EMessagePropertyStatus.PENDING,
            EMessageProperty.STATE,
          ];
          async.each(
            messageIds,
            (messageId, _, done) => {
              _getMessage(redisClient, messageId, (err, message) => {
                if (err) done(err);
                else if (!message) cb(new CallbackEmptyReplyError());
                else {
                  const messageId = message.getId();
                  const messageState = message.getMessageState();

                  const { keyQueuePriorityPending, keyQueuePending } =
                    redisKeys.getQueueKeys(
                      message.getDestinationQueue(),
                      message.getConsumerGroupId(),
                    );
                  const { keyMessage } = redisKeys.getMessageKeys(messageId);
                  keys.push(
                    keyQueuePriorityPending,
                    keyQueuePending,
                    keyMessage,
                  );

                  messageState.incrAttempts();
                  const messagePriority =
                    message.producibleMessage.getPriority() ?? '';
                  argv.push(
                    messageId,
                    messagePriority,
                    JSON.stringify(messageState),
                  );
                  done();
                }
              });
            },
            (err) => {
              if (err) cb(err);
              else {
                redisClient.runScript(
                  ELuaScriptName.REQUEUE_MESSAGE,
                  keys,
                  argv,
                  (err) => cb(err),
                );
              }
            },
          );
        } else cb();
      }
    });
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new RequeueUnacknowledgedWorker(payload);
