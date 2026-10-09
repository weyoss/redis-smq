/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { _parseMessage } from './_parse-message.js';
import { MessageNotFoundError } from '../../errors/index.js';

export function _getMessage(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<MessageEnvelope>,
): void {
  const { keyMessage } = keys.getMessageKeys(messageId);
  redisClient.hgetall(keyMessage, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !Object.keys(reply).length)
      cb(new MessageNotFoundError());
    else cb(null, _parseMessage(reply));
  });
}

/**
 * Strict variant: every ID must resolve to a message. A single missing
 * ID rejects the whole call with `MessageNotFoundError`.
 *
 * Used by `IMessageManager.getMessagesByIds`, whose documented contract
 * requires this behaviour. Preserves the caller's input order in the
 * result.
 */
export function _getMessages(
  redisClient: IRedisClient,
  messageIds: string[],
  cb: ICallback<MessageEnvelope[]>,
): void {
  _fetchMessages(redisClient, messageIds, false, cb);
}

/**
 * Lenient variant: a missing ID is skipped rather than rejecting the
 * call, so the result may be shorter than the input. Preserves the
 * relative order of the messages that *were* fetched.
 *
 * Used by `MessageBrowser.getMessages`, whose contract states that a
 * message deleted between the ID read and the payload read is omitted
 * from the page.
 */
export function _getMessagesLenient(
  redisClient: IRedisClient,
  messageIds: string[],
  cb: ICallback<MessageEnvelope[]>,
): void {
  _fetchMessages(redisClient, messageIds, true, cb);
}

/**
 * Shared implementation of the strict and lenient variants.
 *
 * Assigns each result to the slot at its input index so the output
 * order is deterministic regardless of the order in which the
 * concurrent Redis reads complete (see I1). When `skipMissing` is true,
 * a `MessageNotFoundError` from a single read records an empty slot and
 * the loop continues; otherwise the error short-circuits. Empty slots
 * are filtered out at the end.
 */
function _fetchMessages(
  redisClient: IRedisClient,
  messageIds: string[],
  skipMissing: boolean,
  cb: ICallback<MessageEnvelope[]>,
): void {
  const slots = new Array<MessageEnvelope | null>(messageIds.length);
  async.eachOf(
    messageIds,
    (id, index, done) => {
      _getMessage(redisClient, id, (err, message) => {
        if (err) {
          if (skipMissing && err instanceof MessageNotFoundError) {
            slots[index] = null;
            return done();
          }
          return done(err);
        }
        if (!message) return cb(new CallbackEmptyReplyError());
        slots[index] = message;
        done();
      });
    },
    (err) => {
      if (err) return cb(err);
      cb(
        null,
        slots.filter((m): m is MessageEnvelope => m !== null),
      );
    },
  );
}
