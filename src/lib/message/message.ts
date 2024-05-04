/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback, logger } from 'redis-smq-common';
import { RedisClientInstance } from '../../common/redis-client/redis-client-instance.js';
import { Configuration } from '../../config/index.js';
import { _deleteMessage } from './_/_delete-message.js';
import { _getMessageState } from './_/_get-message-state.js';
import { _getMessageStatus } from './_/_get-message-status.js';
import { _getMessage, _getMessages } from './_/_get-message.js';
import { _requeueMessage } from './_/_requeue-message.js';
import {
  EMessagePropertyStatus,
  IMessageStateTransferable,
  IMessageTransferable,
} from './types/index.js';

export class Message {
  protected logger;
  protected redisClient;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `exchange-fan-out-manager`,
    );
    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  getMessageStatus(
    messageId: string,
    cb: ICallback<EMessagePropertyStatus>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessageStatus(client, messageId, cb);
    });
  }

  getMessageState(
    messageId: string,
    cb: ICallback<IMessageStateTransferable>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessageState(client, messageId, cb);
    });
  }

  getMessagesByIds(
    messageIds: string[],
    cb: ICallback<IMessageTransferable[]>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _getMessages(client, messageIds, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else {
            cb(
              null,
              reply.map((i) => i.transfer()),
            );
          }
        });
    });
  }

  getMessageById(messageId: string, cb: ICallback<IMessageTransferable>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _getMessage(client, messageId, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else cb(null, reply.transfer());
        });
    });
  }

  deleteMessagesByIds(ids: string[], cb: ICallback<void>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _deleteMessage(client, ids, cb);
    });
  }

  deleteMessageById(id: string, cb: ICallback<void>): void {
    this.deleteMessagesByIds([id], cb);
  }

  requeueMessageById(messageId: string, cb: ICallback<void>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _requeueMessage(client, messageId, cb);
    });
  }

  shutdown = (cb: ICallback<void>): void => {
    this.redisClient.shutdown(cb);
  };
}
