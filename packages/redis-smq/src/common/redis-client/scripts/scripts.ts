/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { env } from 'redis-smq-common';

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
  SET_QUEUE_RATE_LIMIT = 'SET_QUEUE_RATE_LIMIT',
}

const dirname = env.getCurrentDir();

export const scriptFileMap = {
  [ELuaScriptName.PUBLISH_SCHEDULED_MESSAGE]: resolve(
    dirname,
    './lua/publish-scheduled-message.lua',
  ),
  [ELuaScriptName.PUBLISH_MESSAGE]: resolve(
    dirname,
    './lua/publish-message.lua',
  ),
  [ELuaScriptName.REQUEUE_MESSAGE]: resolve(
    dirname,
    './lua/requeue-message.lua',
  ),
  [ELuaScriptName.SCHEDULE_MESSAGE]: resolve(
    dirname,
    './lua/schedule-message.lua',
  ),
  [ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED]: resolve(
    dirname,
    './lua/has-queue-rate-exceeded.lua',
  ),
  [ELuaScriptName.CREATE_QUEUE]: resolve(dirname, './lua/create-queue.lua'),
  [ELuaScriptName.INIT_CONSUMER_QUEUE]: resolve(
    dirname,
    './lua/init-consumer-queue.lua',
  ),
  [ELuaScriptName.HANDLE_PROCESSING_QUEUE]: resolve(
    dirname,
    './lua/handle-processing-queue.lua',
  ),
  [ELuaScriptName.ACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './lua/acknowledge-message.lua',
  ),
  [ELuaScriptName.DELETE_MESSAGE]: resolve(dirname, './lua/delete-message.lua'),
  [ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING]: resolve(
    dirname,
    './lua/fetch-message-for-processing.lua',
  ),
  [ELuaScriptName.DELETE_CONSUMER_GROUP]: resolve(
    dirname,
    './lua/delete-consumer-group.lua',
  ),
  [ELuaScriptName.SET_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './lua/set-queue-rate-limit.lua',
  ),
};
