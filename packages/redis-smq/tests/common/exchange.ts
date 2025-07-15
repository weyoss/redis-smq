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
  ExchangeFanOut,
  ExchangeTopic,
} from '../../src/index.js';

const fanOutExchanges: ExchangeFanOut[] = [];

export function getFanOutExchange() {
  const instance = new ExchangeFanOut();
  fanOutExchanges.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownFanOutExchange() {
  for (const i of fanOutExchanges) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}

const topicExchanges: ExchangeTopic[] = [];

export function getTopicExchange() {
  const instance = new ExchangeTopic();
  topicExchanges.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownTopicExchange() {
  for (const i of topicExchanges) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}

const directExchanges: ExchangeDirect[] = [];

export function getDirectExchange() {
  const instance = new ExchangeDirect();
  directExchanges.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownDirectExchange() {
  for (const i of directExchanges) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
