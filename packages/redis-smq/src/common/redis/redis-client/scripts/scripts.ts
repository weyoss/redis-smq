/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { env } from 'redis-smq-common';

export enum ELuaScriptName {
  PUBLISH_SCHEDULED = 'PUBLISH_SCHEDULED',
  PUBLISH_MESSAGE = 'PUBLISH_MESSAGE',
  REQUEUE_MESSAGE = 'REQUEUE_MESSAGE',
  REQUEUE_IMMEDIATE = 'REQUEUE_IMMEDIATE',
  REQUEUE_DELAYED = 'REQUEUE_DELAYED',
  CHECK_QUEUE_RATE_LIMIT = 'CHECK_QUEUE_RATE_LIMIT',
  CREATE_QUEUE = 'CREATE_QUEUE',
  SUBSCRIBE_CONSUMER = 'SUBSCRIBE_CONSUMER',
  UNACKNOWLEDGE_MESSAGE = 'UNACKNOWLEDGE_MESSAGE',
  ACKNOWLEDGE_MESSAGE = 'ACKNOWLEDGE_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  CHECKOUT_MESSAGE = 'CHECKOUT_MESSAGE',
  DELETE_CONSUMER_GROUP = 'DELETE_CONSUMER_GROUP',
  SET_QUEUE_RATE_LIMIT = 'SET_QUEUE_RATE_LIMIT',
}

const dirname = env.getCurrentDir();

export const scriptFileMap: Record<ELuaScriptName, string | string[]> = {
  [ELuaScriptName.PUBLISH_SCHEDULED]: [
    resolve(dirname, './lua/shared-procedures/publish-message.lua'),
    resolve(dirname, './lua/publish-scheduled.lua'),
  ],
  [ELuaScriptName.PUBLISH_MESSAGE]: [
    resolve(dirname, './lua/shared-procedures/publish-message.lua'),
    resolve(dirname, './lua/publish-message.lua'),
  ],
  [ELuaScriptName.REQUEUE_MESSAGE]: [
    resolve(dirname, './lua/shared-procedures/publish-message.lua'),
    resolve(dirname, './lua/requeue-message.lua'),
  ],
  [ELuaScriptName.REQUEUE_IMMEDIATE]: resolve(
    dirname,
    './lua/requeue-immediate.lua',
  ),
  [ELuaScriptName.REQUEUE_DELAYED]: resolve(
    dirname,
    './lua/requeue-delayed.lua',
  ),
  [ELuaScriptName.CREATE_QUEUE]: resolve(dirname, './lua/create-queue.lua'),
  [ELuaScriptName.SUBSCRIBE_CONSUMER]: resolve(
    dirname,
    './lua/subscribe-consumer.lua',
  ),
  [ELuaScriptName.UNACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './lua/unacknowledge-message.lua',
  ),
  [ELuaScriptName.ACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './lua/acknowledge-message.lua',
  ),
  [ELuaScriptName.DELETE_MESSAGE]: resolve(dirname, './lua/delete-message.lua'),
  [ELuaScriptName.CHECKOUT_MESSAGE]: resolve(
    dirname,
    './lua/checkout-message.lua',
  ),
  [ELuaScriptName.DELETE_CONSUMER_GROUP]: resolve(
    dirname,
    './lua/delete-consumer-group.lua',
  ),
  [ELuaScriptName.CHECK_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './lua/check-queue-rate-limit.lua',
  ),
  [ELuaScriptName.SET_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './lua/set-queue-rate-limit.lua',
  ),
};
