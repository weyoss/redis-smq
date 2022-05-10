import { AbstractMessageStorage } from './abstract-message-storage';
import { ICallback, TPaginatedResponse } from '../../../../../types';
import { Message } from '../../message/message';
import { waterfall } from '../../../lib/async';
import { MessageNotFoundError } from '../errors/message-not-found.error';
import { EmptyCallbackReplyError } from '../../../common/errors/empty-callback-reply.error';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ELuaScriptName } from '../../../common/redis-client/lua-scripts';
import { MessageRequeueError } from '../errors/message-requeue.error';

type TFetchMessagesReply = { sequenceId: number; message: Message };

export abstract class List extends AbstractMessageStorage<
  { keyMessages: string },
  {
    messageId: string;
    sequenceId: number;
  },
  TFetchMessagesReply
> {
  protected getMessageById(
    key: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<Message>,
  ): void {
    this.redisClient.lrange(key, sequenceId, sequenceId, (err, reply) => {
      if (err) cb(err);
      else if (!reply || !reply.length) cb(new MessageNotFoundError());
      else {
        const [msg] = reply;
        const message = Message.createFromMessage(msg);
        if (message.getRequiredId() !== messageId)
          cb(new MessageNotFoundError());
        else cb(null, message);
      }
    });
  }

  protected requeueMessage(
    key: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.getMessageById(key, sequenceId, messageId, (err, msg) => {
      if (err) cb(err);
      else if (!msg) cb(new EmptyCallbackReplyError());
      else {
        const message = Message.createFromMessage(msg, false);
        const queue = message.getRequiredQueue();
        message.getRequiredMetadata().reset(); // resetting all system parameters
        const {
          keyQueueSettings,
          keyQueueSettingsPriorityQueuing,
          keyQueuePending,
          keyQueuePendingPriorityMessageIds,
          keyQueuePendingPriorityMessages,
        } = redisKeys.getQueueKeys(queue);
        this.redisClient.runScript(
          ELuaScriptName.REQUEUE_MESSAGE,
          [
            keyQueueSettings,
            keyQueueSettingsPriorityQueuing,
            keyQueuePendingPriorityMessages,
            keyQueuePendingPriorityMessageIds,
            keyQueuePending,
            key,
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
    key: { keyMessages: string },
    id: { messageId: string; sequenceId: number },
    cb: ICallback<void>,
  ): void {
    const { keyMessages } = key;
    const { messageId, sequenceId } = id;
    this.getMessageById(keyMessages, sequenceId, messageId, (err, message) => {
      if (err) cb(err);
      else if (!message) cb(new EmptyCallbackReplyError());
      else
        this.redisClient.lrem(keyMessages, 1, message.toString(), (err) =>
          cb(err),
        );
    });
  }

  protected override fetchMessages(
    key: { keyMessages: string },
    skip: number,
    take: number,
    cb: ICallback<TPaginatedResponse<TFetchMessagesReply>>,
  ): void {
    this.validatePaginationParams(skip, take);
    const { keyMessages } = key;
    const getTotalItems = (cb: ICallback<number>) =>
      this.redisClient.llen(keyMessages, (err, reply) => {
        if (err) cb(err);
        else cb(null, reply ?? 0);
      });
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
    waterfall([getTotalItems, getItems], cb);
  }

  protected override purgeMessages(
    key: { keyMessages: string },
    cb: ICallback<void>,
  ): void {
    const { keyMessages } = key;
    this.redisClient.del(keyMessages, (err) => cb(err));
  }
}
