/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';
import { _getMessage, _getMessages } from './_get-message';
import { _deleteMessage } from './_delete-message';
import { MessageEnvelope } from './message-envelope';
import { EMessagePropertyStatus } from '../../../types';
import { _getMessageStatus } from './_get-message-status';

export class Message {
  getMessageStatus(
    messageId: string,
    cb: ICallback<EMessagePropertyStatus>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessageStatus(client, messageId, cb);
    });
  }

  getMessagesByIds(
    messageIds: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessages(client, messageIds, cb);
    });
  }

  getMessageById(messageId: string, cb: ICallback<MessageEnvelope>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessage(client, messageId, cb);
    });
  }

  deleteMessagesByIds(ids: string[], cb: ICallback<void>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _deleteMessage(client, ids, cb);
    });
  }

  deleteMessageById(id: string, cb: ICallback<void>): void {
    this.deleteMessagesByIds([id], cb);
  }
}
