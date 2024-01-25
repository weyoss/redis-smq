/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClient } from 'redis-smq-common';
import * as fs from 'fs';
import { resolve } from 'path';

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
}

RedisClient.addScript(
  ELuaScriptName.PUBLISH_SCHEDULED_MESSAGE,
  fs
    .readFileSync(resolve(__dirname, './lua/publish-scheduled-message.lua'))
    .toString(),
);
RedisClient.addScript(
  ELuaScriptName.PUBLISH_MESSAGE,
  fs.readFileSync(resolve(__dirname, './lua/publish-message.lua')).toString(),
);
RedisClient.addScript(
  ELuaScriptName.REQUEUE_MESSAGE,
  fs.readFileSync(resolve(__dirname, './lua/requeue-message.lua')).toString(),
);
RedisClient.addScript(
  ELuaScriptName.SCHEDULE_MESSAGE,
  fs.readFileSync(resolve(__dirname, './lua/schedule-message.lua')).toString(),
);
RedisClient.addScript(
  ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED,
  fs
    .readFileSync(resolve(__dirname, './lua/has-queue-rate-exceeded.lua'))
    .toString(),
);
RedisClient.addScript(
  ELuaScriptName.CREATE_QUEUE,
  fs.readFileSync(resolve(__dirname, './lua/create-queue.lua')).toString(),
);
RedisClient.addScript(
  ELuaScriptName.INIT_CONSUMER_QUEUE,
  fs
    .readFileSync(resolve(__dirname, './lua/init-consumer-queue.lua'))
    .toString(),
);
RedisClient.addScript(
  ELuaScriptName.HANDLE_PROCESSING_QUEUE,
  fs
    .readFileSync(resolve(__dirname, './lua/handle-processing-queue.lua'))
    .toString(),
);
RedisClient.addScript(
  ELuaScriptName.ACKNOWLEDGE_MESSAGE,
  fs
    .readFileSync(resolve(__dirname, './lua/acknowledge-message.lua'))
    .toString(),
);
RedisClient.addScript(
  ELuaScriptName.DELETE_MESSAGE,
  fs.readFileSync(resolve(__dirname, './lua/delete-message.lua')).toString(),
);
RedisClient.addScript(
  ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING,
  fs
    .readFileSync(resolve(__dirname, './lua/fetch-message-for-processing.lua'))
    .toString(),
);
RedisClient.addScript(
  ELuaScriptName.DELETE_CONSUMER_GROUP,
  fs
    .readFileSync(resolve(__dirname, './lua/delete-consumer-group.lua'))
    .toString(),
);
