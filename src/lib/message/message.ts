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
import {
  EMessagePropertyStatus,
  IMessageStateSerialized,
  IConsumableMessage,
} from '../../../types';
import { _getMessageStatus } from './_get-message-status';
import { _createRMessage } from './_create-r-message';
import { _getMessageState } from './_get-message-state';

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

  getMessageState(
    messageId: string,
    cb: ICallback<IMessageStateSerialized>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessageState(client, messageId, cb);
    });
  }

  getMessagesByIds(
    messageIds: string[],
    cb: ICallback<IConsumableMessage[]>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _getMessages(client, messageIds, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else {
            cb(
              null,
              reply.map((i) => _createRMessage(i)),
            );
          }
        });
    });
  }

  getMessageById(messageId: string, cb: ICallback<IConsumableMessage>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _getMessage(client, messageId, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else cb(null, _createRMessage(reply));
        });
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
