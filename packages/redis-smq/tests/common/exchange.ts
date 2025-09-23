/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  ExchangeDirect,
  ExchangeFanout,
  ExchangeTopic,
} from '../../src/index.js';

const fanOutExchanges: ExchangeFanout[] = [];

export function getFanOutExchange() {
  const instance = new ExchangeFanout();
  fanOutExchanges.push(instance);
  return bluebird.promisifyAll(instance);
}

const topicExchanges: ExchangeTopic[] = [];

export function getTopicExchange() {
  const instance = new ExchangeTopic();
  topicExchanges.push(instance);
  return bluebird.promisifyAll(instance);
}

const directExchanges: ExchangeDirect[] = [];

export function getDirectExchange() {
  const instance = new ExchangeDirect();
  directExchanges.push(instance);
  return bluebird.promisifyAll(instance);
}
