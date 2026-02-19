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

export enum ERedisScriptName {
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
  DELETE_QUEUE = 'DELETE_QUEUE',
  CLEAR_QUEUE_RATE_LIMIT = 'CLEAR_QUEUE_RATE_LIMIT',
  SET_QUEUE_STATE = 'SET_QUEUE_STATE',
}

const dirname = env.getCurrentDir();

export const scriptFileMap: Record<ERedisScriptName, string | string[]> = {
  [ERedisScriptName.PUBLISH_SCHEDULED]: [
    resolve(dirname, './scripts/shared-procedures/publish-message.lua'),
    resolve(dirname, './scripts/publish-scheduled.lua'),
  ],
  [ERedisScriptName.PUBLISH_MESSAGE]: [
    resolve(dirname, './scripts/shared-procedures/publish-message.lua'),
    resolve(dirname, './scripts/publish-message.lua'),
  ],
  [ERedisScriptName.REQUEUE_MESSAGE]: [
    resolve(dirname, './scripts/shared-procedures/publish-message.lua'),
    resolve(dirname, './scripts/requeue-message.lua'),
  ],
  [ERedisScriptName.REQUEUE_IMMEDIATE]: resolve(
    dirname,
    './scripts/requeue-immediate.lua',
  ),
  [ERedisScriptName.REQUEUE_DELAYED]: resolve(
    dirname,
    './scripts/requeue-delayed.lua',
  ),
  [ERedisScriptName.CREATE_QUEUE]: resolve(
    dirname,
    './scripts/create-queue.lua',
  ),
  [ERedisScriptName.SUBSCRIBE_CONSUMER]: resolve(
    dirname,
    './scripts/subscribe-consumer.lua',
  ),
  [ERedisScriptName.UNACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './scripts/unacknowledge-message.lua',
  ),
  [ERedisScriptName.ACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './scripts/acknowledge-message.lua',
  ),
  [ERedisScriptName.DELETE_MESSAGE]: resolve(
    dirname,
    './scripts/delete-message.lua',
  ),
  [ERedisScriptName.CHECKOUT_MESSAGE]: resolve(
    dirname,
    './scripts/checkout-message.lua',
  ),
  [ERedisScriptName.DELETE_CONSUMER_GROUP]: resolve(
    dirname,
    './scripts/delete-consumer-group.lua',
  ),
  [ERedisScriptName.CHECK_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './scripts/check-queue-rate-limit.lua',
  ),
  [ERedisScriptName.SET_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './scripts/set-queue-rate-limit.lua',
  ),
  [ERedisScriptName.DELETE_QUEUE]: resolve(
    dirname,
    './scripts/delete-queue.lua',
  ),
  [ERedisScriptName.CLEAR_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './scripts/clear-queue-rate-limit.lua',
  ),
  [ERedisScriptName.SET_QUEUE_STATE]: resolve(
    dirname,
    './scripts/set-queue-state.lua',
  ),
};
