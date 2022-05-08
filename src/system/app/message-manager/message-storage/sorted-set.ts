import { AbstractMessageStorage } from './abstract-message-storage';
import { ICallback, TPaginatedResponse } from '../../../../../types';
import { Message } from '../../message/message';
import { each, waterfall } from '../../../lib/async';
import { EmptyCallbackReplyError } from '../../../common/errors/empty-callback-reply.error';

export class SortedSet extends AbstractMessageStorage<
  {
    keyMessages: string;
    keyMessagesWeight: string;
  },
  {
    messageId: string;
  },
  Message
> {
  protected override deleteMessage(
    key: { keyMessages: string; keyMessagesWeight: string },
    id: { messageId: string },
    cb: ICallback<void>,
  ): void {
    const { keyMessages, keyMessagesWeight } = key;
    const { messageId } = id;
    // Not checking message existence.
    // If the message exists it will be deleted.
    // Otherwise, assuming that it has been already deleted
    const multi = this.redisClient.multi();
    multi.hdel(keyMessages, messageId);
    multi.zrem(keyMessagesWeight, messageId);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  protected override fetchMessages(
    key: { keyMessages: string; keyMessagesWeight: string },
    skip: number,
    take: number,
    cb: ICallback<TPaginatedResponse<Message>>,
  ): void {
    this.validatePaginationParams(skip, take);
    const { keyMessages, keyMessagesWeight } = key;
    const getTotalItems = (cb: ICallback<number>) =>
      this.redisClient.zcard(keyMessagesWeight, (err, reply) => {
        if (err) cb(err);
        else cb(null, reply ?? 0);
      });
    const getMessages = (
      reply: { total: number; items: string[] },
      cb: ICallback<TPaginatedResponse<Message>>,
    ) => {
      if (!reply.total || !reply.items.length)
        cb(null, { total: reply.total, items: [] });
      else {
        this.redisClient.hmget(keyMessages, reply.items, (err, msg) => {
          if (err) cb(err);
          else {
            const messages: Message[] = [];
            each(
              msg ?? [],
              (item, index, done) => {
                if (!item) done(new EmptyCallbackReplyError());
                else {
                  messages.push(Message.createFromMessage(item));
                  done();
                }
              },
              (err) => {
                if (err) cb(err);
                else {
                  cb(null, {
                    total: reply.total,
                    items: messages,
                  });
                }
              },
            );
          }
        });
      }
    };
    const getMessageIds = (
      total: number,
      cb: ICallback<{ total: number; items: string[] }>,
    ) => {
      if (!total) cb(null, { total, items: [] });
      else {
        this.redisClient.zrange(
          keyMessagesWeight,
          skip,
          skip + take - 1,
          (err, items) => {
            if (err) cb(err);
            else cb(null, { total, items: items ?? [] });
          },
        );
      }
    };
    waterfall([getTotalItems, getMessageIds, getMessages], cb);
  }

  protected override purgeMessages(
    key: { keyMessages: string; keyMessagesWeight: string },
    cb: ICallback<void>,
  ): void {
    const { keyMessages, keyMessagesWeight } = key;
    const multi = this.redisClient.multi();
    multi.del(keyMessages);
    multi.del(keyMessagesWeight);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }
}
