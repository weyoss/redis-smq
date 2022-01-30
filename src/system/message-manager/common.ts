import { RedisClient } from '../common/redis-client/redis-client';
import {
  ICallback,
  TGetMessagesReply,
  TGetScheduledMessagesReply,
  TPaginatedResponse,
  TQueueParams,
} from '../../../types';
import { Message } from '../message/message';
import { LockManager } from '../common/lock-manager/lock-manager';
import { MessageNotFoundError } from './errors/message-not-found.error';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { ArgumentError } from '../common/errors/argument.error';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { ELuaScriptName } from '../common/redis-client/lua-scripts';
import { each, waterfall } from '../lib/async';

export const validatePaginationParams = (skip: number, take: number) => {
  if (skip < 0 || take < 1) {
    throw new ArgumentError(
      `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
    );
  }
};

export const deleteListMessageAtSequenceId = (
  redisClient: RedisClient,
  lockKey: string,
  from: string,
  sequenceId: number,
  messageId: string,
  queue: TQueueParams,
  cb: ICallback<void>,
): void => {
  LockManager.exclusiveRun(
    redisClient,
    lockKey,
    (cb) => {
      getListMessageAtSequenceId(
        redisClient,
        from,
        sequenceId,
        messageId,
        queue,
        (err, message) => {
          if (err) cb(err);
          else if (!message) cb(new EmptyCallbackReplyError());
          else redisClient.lrem(from, 1, message.toString(), (err) => cb(err));
        },
      );
    },
    cb,
  );
};

export const getListMessageAtSequenceId = (
  redisClient: RedisClient,
  from: string,
  sequenceId: number,
  messageId: string,
  queue: TQueueParams,
  cb: ICallback<Message>,
): void => {
  const { name, ns } = queue;
  redisClient.lrange(from, sequenceId, sequenceId, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !reply.length)
      cb(new MessageNotFoundError(messageId, name, ns, sequenceId));
    else {
      const [msg] = reply;
      const message = Message.createFromMessage(msg);
      if (message.getRequiredId() !== messageId)
        cb(new MessageNotFoundError(messageId, name, ns, sequenceId));
      else cb(null, message);
    }
  });
};

export const getSortedSetSize = (
  redisClient: RedisClient,
  key: string,
  cb: ICallback<number>,
): void => {
  redisClient.zcard(key, (err, reply) => {
    if (err) cb(err);
    else cb(null, reply ?? 0);
  });
};

export const getListLength = (
  redisClient: RedisClient,
  key: string,
  cb: ICallback<number>,
): void => {
  redisClient.llen(key, (err, reply) => {
    if (err) cb(err);
    else cb(null, reply ?? 0);
  });
};

export const getListMessages = (
  client: RedisClient,
  from: string,
  skip: number,
  take: number,
  cb: ICallback<Message[]>,
): void => {
  validatePaginationParams(skip, take);
  client.lrange(from, skip, skip + take - 1, (err, result) => {
    if (err) cb(err);
    else {
      const items = (result ?? []).map((msg) => Message.createFromMessage(msg));
      cb(null, items);
    }
  });
};

export const getPaginatedListMessages = (
  client: RedisClient,
  key: string,
  skip: number,
  take: number,
  cb: ICallback<TGetMessagesReply>,
): void => {
  const getTotalItems = (cb: ICallback<number>) =>
    getListLength(client, key, cb);
  const getItems = (total: number, cb: ICallback<TGetMessagesReply>) => {
    if (!total) {
      cb(null, {
        total,
        items: [],
      });
    } else
      getListMessages(client, key, skip, take, (err, reply) => {
        if (err) cb(err);
        else {
          const items = (reply ?? []).map((message, index) => ({
            sequenceId: skip + index,
            message,
          }));
          cb(null, { total, items });
        }
      });
  };
  waterfall([getTotalItems, getItems], cb);
};

export const getPaginatedSortedSetMessages = (
  redisClient: RedisClient,
  keyMessages: string,
  keySortedSet: string,
  skip: number,
  take: number,
  cb: ICallback<TPaginatedResponse<Message>>,
): void => {
  const getTotalItems = (cb: ICallback<number>) =>
    getSortedSetSize(redisClient, keySortedSet, cb);
  const getMessages = (
    reply: { total: number; items: string[] },
    cb: ICallback<TGetScheduledMessagesReply>,
  ) => {
    if (!reply.total || !reply.items.length)
      cb(null, { total: reply.total, items: [] });
    else {
      redisClient.hmget(keyMessages, reply.items, (err, msg) => {
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
      redisClient.zrange(keySortedSet, skip, skip + take - 1, (err, items) => {
        if (err) cb(err);
        else cb(null, { total, items: items ?? [] });
      });
    }
  };
  waterfall([getTotalItems, getMessageIds, getMessages], cb);
};

export function requeueListMessage(
  redisClient: RedisClient,
  queue: TQueueParams,
  from: string,
  index: number,
  messageId: string,
  priority: number | undefined,
  cb: ICallback<void>,
): void {
  getListMessageAtSequenceId(
    redisClient,
    from,
    index,
    messageId,
    queue,
    (err, msg) => {
      if (err) cb(err);
      else if (!msg) cb(new EmptyCallbackReplyError());
      else {
        const message = Message.createFromMessage(msg, true); // resetting all system parameters
        if (priority !== undefined) {
          message.setPriority(priority);
        } else message.disablePriority();
        const {
          keyQueues,
          keyQueuePending,
          keyQueuePendingPriorityMessageIds,
          keyQueuePendingPriorityMessages,
        } = redisKeys.getQueueKeys(queue.name, queue.ns);
        redisClient.runScript(
          ELuaScriptName.REQUEUE_MESSAGE,
          [
            keyQueues,
            JSON.stringify(queue),
            message.getRequiredId(),
            JSON.stringify(message),
            message.getPriority() ?? '',
            keyQueuePendingPriorityMessages,
            keyQueuePendingPriorityMessageIds,
            keyQueuePending,
            from,
            JSON.stringify(msg),
          ],
          (err) => cb(err),
        );
      }
    },
  );
}
