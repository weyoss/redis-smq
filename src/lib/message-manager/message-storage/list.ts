import { AbstractMessageStorage } from './abstract-message-storage';
import { TPaginatedResponse } from '../../../../types';
import { Message } from '../../message/message';
import { async, errors } from 'redis-smq-common';
import { MessageNotFoundError } from '../errors/message-not-found.error';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { MessageRequeueError } from '../errors/message-requeue.error';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { ICallback } from 'redis-smq-common/dist/types';

type TFetchMessagesReply = { sequenceId: number; message: Message };

type TListKeyMessagesParams = {
  keyMessages: string;
};

type TListMessageIdParams = {
  messageId: string;
  sequenceId: number;
};

export abstract class List extends AbstractMessageStorage<
  TListKeyMessagesParams,
  TListMessageIdParams
> {
  protected getMessageById(
    key: TListKeyMessagesParams,
    id: TListMessageIdParams,
    cb: ICallback<Message>,
  ): void {
    const { keyMessages } = key;
    const { messageId, sequenceId } = id;
    this.redisClient.lrange(
      keyMessages,
      sequenceId,
      sequenceId,
      (err, reply) => {
        if (err) cb(err);
        else if (!reply || !reply.length) cb(new MessageNotFoundError());
        else {
          const [msg] = reply;
          const message = Message.createFromMessage(msg);
          if (message.getRequiredId() !== messageId)
            cb(new MessageNotFoundError());
          else cb(null, message);
        }
      },
    );
  }

  protected requeueMessage(
    key: TListKeyMessagesParams,
    id: TListMessageIdParams,
    cb: ICallback<void>,
  ): void {
    this.getMessageById(key, id, (err, msg) => {
      if (err) cb(err);
      else if (!msg) cb(new errors.EmptyCallbackReplyError());
      else {
        const { keyMessages } = key;
        const message = Message.createFromMessage(msg, false);
        const queue = message.getRequiredQueue();
        message.getRequiredMetadata().reset(); // resetting all system parameters
        const {
          keyQueueSettings,
          keyQueueSettingsPriorityQueuing,
          keyQueuePending,
          keyQueuePendingPriorityMessageWeight,
          keyQueuePendingPriorityMessages,
        } = redisKeys.getQueueKeys(queue);
        this.redisClient.runScript(
          ELuaScriptName.REQUEUE_MESSAGE,
          [
            keyQueueSettings,
            keyQueueSettingsPriorityQueuing,
            keyQueuePendingPriorityMessages,
            keyQueuePendingPriorityMessageWeight,
            keyQueuePending,
            keyMessages,
          ],
          [
            message.getRequiredId(),
            JSON.stringify(message),
            message.getPriority() ?? '',
            JSON.stringify(msg),
          ],
          (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(new MessageRequeueError());
            else cb();
          },
        );
      }
    });
  }

  protected override deleteMessage(
    key: TListKeyMessagesParams,
    id: TListMessageIdParams,
    cb: ICallback<void>,
  ): void {
    this.getMessageById(key, id, (err, message) => {
      if (err) cb(err);
      else if (!message) cb(new errors.EmptyCallbackReplyError());
      else {
        const { keyMessages } = key;
        this.redisClient.lrem(keyMessages, 1, message.toString(), (err) =>
          cb(err),
        );
      }
    });
  }

  protected override fetchMessages(
    key: TListKeyMessagesParams,
    skip: number,
    take: number,
    cb: ICallback<TPaginatedResponse<TFetchMessagesReply>>,
  ): void {
    this.validatePaginationParams(skip, take);
    const { keyMessages } = key;
    const getItems = (
      total: number,
      cb: ICallback<TPaginatedResponse<TFetchMessagesReply>>,
    ) => {
      if (!total) {
        cb(null, {
          total,
          items: [],
        });
      } else
        this.redisClient.lrange(
          keyMessages,
          skip,
          skip + take - 1,
          (err, result) => {
            if (err) cb(err);
            else {
              const items = (result ?? []).map((msg, index) => {
                const message = Message.createFromMessage(msg);
                return {
                  sequenceId: skip + index,
                  message,
                };
              });
              cb(null, { total, items });
            }
          },
        );
    };
    async.waterfall(
      [(cb: ICallback<number>) => this.countMessages(key, cb), getItems],
      cb,
    );
  }

  protected override purgeMessages(
    key: TListKeyMessagesParams,
    cb: ICallback<void>,
  ): void {
    const { keyMessages } = key;
    this.redisClient.del(keyMessages, (err) => cb(err));
  }

  protected countMessages(
    key: TListKeyMessagesParams,
    cb: ICallback<number>,
  ): void {
    const { keyMessages } = key;
    this.redisClient.llen(keyMessages, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }
}
