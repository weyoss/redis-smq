/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { RedisSMQ } from '../../src/index.js';

export function getFanOutExchange() {
  return bluebird.promisifyAll(RedisSMQ.createFanoutExchange());
}

export function getTopicExchange() {
  return bluebird.promisifyAll(RedisSMQ.createTopicExchange());
}

export function getDirectExchange() {
  return bluebird.promisifyAll(RedisSMQ.createDirectExchange());
}
