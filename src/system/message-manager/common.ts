import { RedisClient } from '../redis-client/redis-client';
import {
  ICallback,
  TGetMessagesReply,
  TGetScheduledMessagesReply,
  TPaginatedResponse,
} from '../../../types';
import { Message } from '../message';
import * as async from 'async';
import { LockManager } from '../common/lock-manager';

export const validatePaginationParams = (skip: number, take: number) => {
  if (skip < 0 || take < 1) {
    throw new Error(
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
  cb: ICallback<void>,
): void => {
  LockManager.lockFN(
    redisClient,
    lockKey,
    (cb) => {
      redisClient.lrange(from, sequenceId, sequenceId, (err, reply) => {
        if (err) cb(err);
        else if (!reply || !reply.length) cb(new Error('Message not found'));
        else {
          const [msg] = reply;
          const message = Message.createFromMessage(msg);
          if (message.getId() !== messageId) cb(new Error('Message not found'));
          else redisClient.lrem(from, 1, msg, (err) => cb(err));
        }
      });
    },
    cb,
  );
};

export const getListMessageAtSequenceId = (
  redisClient: RedisClient,
  from: string,
  sequenceId: number,
  messageId: string,
  cb: ICallback<Message>,
): void => {
  redisClient.lrange(from, sequenceId, sequenceId, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !reply.length) cb(new Error('Message not found'));
    else {
      const [msg] = reply;
      const message = Message.createFromMessage(msg);
      if (message.getId() !== messageId) cb(new Error('Message not found'));
      else cb(null, message);
    }
  });
};

export const getSortedSetSize = (
  redisClient: RedisClient,
  queue: string,
  cb: ICallback<number>,
): void => {
  redisClient.zcard(queue, (err, reply) => {
    if (err) cb(err);
    else cb(null, reply ?? 0);
  });
};

export const getListLength = (
  redisClient: RedisClient,
  queue: string,
  cb: ICallback<number>,
): void => {
  redisClient.llen(queue, (err, reply) => {
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
  async.waterfall(
    [getTotalItems, getItems],
    (err?: Error | null, result?: TGetMessagesReply) => {
      if (err) cb(err);
      else cb(null, result);
    },
  );
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
          cb(null, {
            total: reply.total,
            items: (msg ?? []).map((i) => Message.createFromMessage(i)),
          });
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
  async.waterfall([getTotalItems, getMessageIds, getMessages], cb);
};
