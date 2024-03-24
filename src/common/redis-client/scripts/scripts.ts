/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as fs from 'fs';
import { resolve } from 'path';
import { getDirname, RedisClientAbstract } from 'redis-smq-common';

export enum ELuaScriptName {
  PUBLISH_SCHEDULED_MESSAGE = 'PUBLISH_SCHEDULED_MESSAGE',
  PUBLISH_MESSAGE = 'PUBLISH_MESSAGE',
  REQUEUE_MESSAGE = 'REQUEUE_MESSAGE',
  SCHEDULE_MESSAGE = 'SCHEDULE_MESSAGE',
  HAS_QUEUE_RATE_EXCEEDED = 'HAS_QUEUE_RATE_EXCEEDED',
  CREATE_QUEUE = 'CREATE_QUEUE',
  INIT_CONSUMER_QUEUE = 'INIT_CONSUMER_QUEUE',
  HANDLE_PROCESSING_QUEUE = 'HANDLE_PROCESSING_QUEUE',
  ACKNOWLEDGE_MESSAGE = 'ACKNOWLEDGE_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  FETCH_MESSAGE_FOR_PROCESSING = 'FETCH_MESSAGE_FOR_PROCESSING',
  DELETE_CONSUMER_GROUP = 'DELETE_CONSUMER_GROUP',
  CLEANUP_OFFLINE_CONSUMER = 'CLEANUP_OFFLINE_CONSUMER',
}

RedisClientAbstract.addScript(
  ELuaScriptName.PUBLISH_SCHEDULED_MESSAGE,
  fs
    .readFileSync(resolve(getDirname(), './lua/publish-scheduled-message.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.PUBLISH_MESSAGE,
  fs
    .readFileSync(resolve(getDirname(), './lua/publish-message.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.REQUEUE_MESSAGE,
  fs
    .readFileSync(resolve(getDirname(), './lua/requeue-message.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.SCHEDULE_MESSAGE,
  fs
    .readFileSync(resolve(getDirname(), './lua/schedule-message.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED,
  fs
    .readFileSync(resolve(getDirname(), './lua/has-queue-rate-exceeded.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.CREATE_QUEUE,
  fs.readFileSync(resolve(getDirname(), './lua/create-queue.lua')).toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.INIT_CONSUMER_QUEUE,
  fs
    .readFileSync(resolve(getDirname(), './lua/init-consumer-queue.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.HANDLE_PROCESSING_QUEUE,
  fs
    .readFileSync(resolve(getDirname(), './lua/handle-processing-queue.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.ACKNOWLEDGE_MESSAGE,
  fs
    .readFileSync(resolve(getDirname(), './lua/acknowledge-message.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.DELETE_MESSAGE,
  fs.readFileSync(resolve(getDirname(), './lua/delete-message.lua')).toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING,
  fs
    .readFileSync(
      resolve(getDirname(), './lua/fetch-message-for-processing.lua'),
    )
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.DELETE_CONSUMER_GROUP,
  fs
    .readFileSync(resolve(getDirname(), './lua/delete-consumer-group.lua'))
    .toString(),
);
RedisClientAbstract.addScript(
  ELuaScriptName.CLEANUP_OFFLINE_CONSUMER,
  fs
    .readFileSync(resolve(getDirname(), './lua/cleanup-offline-consumer.lua'))
    .toString(),
);
