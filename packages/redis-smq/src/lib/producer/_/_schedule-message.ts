/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { EQueueProperty } from '../../queue/index.js';
import {
  ProducerError,
  ProducerQueueNotFoundError,
  ProducerScheduleInvalidParametersError,
} from '../errors/index.js';

export function _scheduleMessage(
  mixed: IRedisClient,
  message: MessageEnvelope,
  cb: ICallback<void>,
): void {
  const timestamp = message.getNextScheduledTimestamp();
  if (timestamp > 0) {
    const {
      keyQueueProperties,
      keyQueueScheduled,
      keyQueueMessages,
      keyQueueDelayed,
    } = redisKeys.getQueueKeys(
      message.getDestinationQueue(),
      message.getConsumerGroupId(),
    );
    const ts = Date.now();
    message.getMessageState().setScheduledAt(ts).setLastScheduledAt(ts);
    const messageId = message.getId();
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    mixed.runScript(
      ELuaScriptName.SCHEDULE_MESSAGE,
      [
        keyQueueMessages,
        keyQueueProperties,
        keyMessage,
        keyQueueScheduled,
        keyQueueDelayed,
      ],
      [
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.MESSAGES_COUNT,
        EMessageProperty.MESSAGE,
        EMessageProperty.STATUS,
        EMessagePropertyStatus.SCHEDULED,
        EMessageProperty.STATE,
        '0',
        messageId,
        JSON.stringify(message),
        `${timestamp}`,
        JSON.stringify(message.getMessageState()),
      ],
      (err, reply) => {
        if (err) cb(err);
        else if (reply !== 'OK') {
          if (reply === 'QUEUE_NOT_FOUND') {
            cb(new ProducerQueueNotFoundError());
          } else if (reply !== 'INVALID_PARAMETERS') {
            cb(new ProducerScheduleInvalidParametersError());
          } else {
            cb(new ProducerError());
          }
        } else cb();
      },
    );
  } else cb(new ProducerScheduleInvalidParametersError());
}
