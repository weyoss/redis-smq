import { RedisClient } from '../redis-client/redis-client';
import { ICallback } from '../../../types';
import { Message } from '../message';
import { TPaginatedRedisQuery } from '../../../types';
import * as async from 'async';
import { LockManager } from '../common/lock-manager';

export const deleteListMessageAtIndex = (
  redisClient: RedisClient,
  lockKey: string,
  from: string,
  index: number,
  messageId: string,
  cb: ICallback<void>,
): void => {
  LockManager.lockFN(
    redisClient,
    lockKey,
    (cb) => {
      redisClient.lrange(from, index, index, (err, reply) => {
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

export const deleteSortedSetMessageAtIndex = (
  redisClient: RedisClient,
  lockKey: string,
  from: string,
  index: number,
  messageId: string,
  cb: ICallback<void>,
): void => {
  LockManager.lockFN(
    redisClient,
    lockKey,
    (cb) => {
      redisClient.zrange(from, index, index, (err, reply) => {
        if (err) cb(err);
        else if (!reply || !reply.length) cb(new Error('Message not found'));
        else {
          const [msg] = reply;
          const message = Message.createFromMessage(msg);
          if (message.getId() !== messageId) cb(new Error('Message not found'));
          else redisClient.zrem(from, msg, (err) => cb(err));
        }
      });
    },
    cb,
  );
};

export const getListMessageAtIndex = (
  redisClient: RedisClient,
  from: string,
  index: number,
  messageId: string,
  cb: ICallback<Message>,
): void => {
  redisClient.lrange(from, index, index, (err, reply) => {
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

export const getSortedSetMessageAtIndex = (
  redisClient: RedisClient,
  from: string,
  index: number,
  messageId: string,
  cb: ICallback<Message>,
): void => {
  redisClient.zrange(from, index, index, (err, reply) => {
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
  client.lrange(from, skip, skip + take - 1, (err, result) => {
    if (err) cb(err);
    else {
      const items = (result ?? []).map((msg) => Message.createFromMessage(msg));
      cb(null, items);
    }
  });
};

export const getSortedSetMessages = (
  client: RedisClient,
  from: string,
  skip: number,
  take: number,
  cb: ICallback<Message[]>,
): void => {
  client.zrange(from, skip, skip + take - 1, (err, result) => {
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
  cb: ICallback<TPaginatedRedisQuery<Message>>,
): void => {
  if (skip < 0 || take <= 0) {
    cb(
      new Error(
        `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
      ),
    );
  } else {
    const getTotalItems = (cb: ICallback<number>) =>
      getListLength(client, key, cb);
    const getItems = (
      total: number,
      cb: ICallback<TPaginatedRedisQuery<Message>>,
    ) => {
      if (!total) {
        cb(null, {
          total,
          items: [],
        });
      } else
        getListMessages(client, key, skip, take, (err, items) => {
          if (err) cb(err);
          else cb(null, { total, items: items ?? [] });
        });
    };
    async.waterfall(
      [getTotalItems, getItems],
      (err?: Error | null, result?: TPaginatedRedisQuery<Message>) => {
        if (err) cb(err);
        else cb(null, result);
      },
    );
  }
};

export const getPaginatedSortedSetMessages = (
  client: RedisClient,
  key: string,
  skip: number,
  take: number,
  cb: ICallback<TPaginatedRedisQuery<Message>>,
): void => {
  if (skip < 0 || take <= 0) {
    cb(
      new Error(
        `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
      ),
    );
  } else {
    const getTotalItems = (cb: ICallback<number>) =>
      getSortedSetSize(client, key, cb);
    const getItems = (
      total: number,
      cb: ICallback<TPaginatedRedisQuery<Message>>,
    ) => {
      if (!total) {
        cb(null, {
          total,
          items: [],
        });
      } else
        getSortedSetMessages(client, key, skip, take, (err, items) => {
          if (err) cb(err);
          else cb(null, { total, items: items ?? [] });
        });
    };
    async.waterfall(
      [getTotalItems, getItems],
      (err?: Error | null, result?: TPaginatedRedisQuery<Message>) => {
        if (err) cb(err);
        else cb(null, result);
      },
    );
  }
};
