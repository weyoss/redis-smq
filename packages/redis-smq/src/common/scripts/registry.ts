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
  UNSUBSCRIBE_CONSUMER = 'UNSUBSCRIBE_CONSUMER',
  UNACKNOWLEDGE_MESSAGE = 'UNACKNOWLEDGE_MESSAGE',
  ACKNOWLEDGE_MESSAGE = 'ACKNOWLEDGE_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  CHECKOUT_MESSAGE = 'CHECKOUT_MESSAGE',
  DELETE_CONSUMER_GROUP = 'DELETE_CONSUMER_GROUP',
  SET_QUEUE_RATE_LIMIT = 'SET_QUEUE_RATE_LIMIT',
  DELETE_QUEUE = 'DELETE_QUEUE',
  CLEAR_QUEUE_RATE_LIMIT = 'CLEAR_QUEUE_RATE_LIMIT',
  SET_QUEUE_STATE = 'SET_QUEUE_STATE',
  GET_QUEUE_STATE = 'GET_QUEUE_STATE',
  SAVE_CONFIG = 'SAVE_CONFIG',
}

const dirname = env.getCurrentDir();

export const scriptFileMap: Record<ERedisScriptName, string | string[]> = {
  [ERedisScriptName.PUBLISH_SCHEDULED]: [
    resolve(dirname, './shared-procedures/publish-message.lua'),
    resolve(dirname, './publish-scheduled.lua'),
  ],
  [ERedisScriptName.PUBLISH_MESSAGE]: [
    resolve(dirname, './shared-procedures/publish-message.lua'),
    resolve(dirname, './publish-message.lua'),
  ],
  [ERedisScriptName.REQUEUE_MESSAGE]: [
    resolve(dirname, './shared-procedures/publish-message.lua'),
    resolve(dirname, './requeue-message.lua'),
  ],
  [ERedisScriptName.REQUEUE_IMMEDIATE]: resolve(
    dirname,
    './requeue-immediate.lua',
  ),
  [ERedisScriptName.REQUEUE_DELAYED]: resolve(dirname, './requeue-delayed.lua'),
  [ERedisScriptName.CREATE_QUEUE]: resolve(dirname, './create-queue.lua'),
  [ERedisScriptName.SUBSCRIBE_CONSUMER]: resolve(
    dirname,
    './subscribe-consumer.lua',
  ),
  [ERedisScriptName.UNSUBSCRIBE_CONSUMER]: resolve(
    dirname,
    './unsubscribe-consumer.lua',
  ),
  [ERedisScriptName.UNACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './unacknowledge-message.lua',
  ),
  [ERedisScriptName.ACKNOWLEDGE_MESSAGE]: resolve(
    dirname,
    './acknowledge-message.lua',
  ),
  [ERedisScriptName.DELETE_MESSAGE]: resolve(dirname, './delete-message.lua'),
  [ERedisScriptName.CHECKOUT_MESSAGE]: resolve(
    dirname,
    './checkout-message.lua',
  ),
  [ERedisScriptName.DELETE_CONSUMER_GROUP]: resolve(
    dirname,
    './delete-consumer-group.lua',
  ),
  [ERedisScriptName.CHECK_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './check-queue-rate-limit.lua',
  ),
  [ERedisScriptName.SET_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './set-queue-rate-limit.lua',
  ),
  [ERedisScriptName.DELETE_QUEUE]: resolve(dirname, './delete-queue.lua'),
  [ERedisScriptName.CLEAR_QUEUE_RATE_LIMIT]: resolve(
    dirname,
    './clear-queue-rate-limit.lua',
  ),
  [ERedisScriptName.SET_QUEUE_STATE]: resolve(dirname, './set-queue-state.lua'),
  [ERedisScriptName.GET_QUEUE_STATE]: resolve(dirname, './get-queue-state.lua'),
  [ERedisScriptName.SAVE_CONFIG]: resolve(dirname, './save-config.lua'),
};
