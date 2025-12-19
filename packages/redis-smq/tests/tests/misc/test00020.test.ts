/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  EExchangeType,
  EMessagePriority,
  ProducibleMessage,
} from '../../../src/index.js';
import { MessagePropertyError } from '../../../src/errors/index.js';

test('ProducibleMessage', async () => {
  const msg = new ProducibleMessage();
  expect(() => {
    msg.setScheduledRepeatPeriod(-1);
  }).toThrow(MessagePropertyError);
  expect(() => {
    msg.setScheduledDelay(-1);
  }).toThrow(MessagePropertyError);
  expect(() => {
    msg.setScheduledRepeat(-1);
  }).toThrow(MessagePropertyError);
  expect(() => {
    msg.setTTL(-1);
  }).toThrow(MessagePropertyError);
  expect(() => {
    msg.setConsumeTimeout(-1);
  }).toThrow(MessagePropertyError);
  expect(() => {
    msg.setRetryThreshold(-1);
  }).toThrow(MessagePropertyError);
  expect(() => {
    msg.setRetryDelay(-1);
  }).toThrow(MessagePropertyError);

  msg.setPriority(EMessagePriority.HIGHEST);
  expect(msg.getPriority()).toBe(EMessagePriority.HIGHEST);
  expect(msg.hasPriority()).toBe(true);

  msg.disablePriority();
  expect(msg.getPriority()).toBe(null);
  expect(msg.hasPriority()).toBe(false);

  msg.setDirectExchange('my-direct');
  expect(msg.getExchange()).toEqual({
    ns: 'testing',
    name: 'my-direct',
    type: EExchangeType.DIRECT,
  });
  expect(msg.getQueue()).toEqual(null);

  msg.setTopicExchange('my-topic');
  expect(msg.getExchange()).toEqual({
    ns: 'testing',
    name: 'my-topic',
    type: EExchangeType.TOPIC,
  });
  expect(msg.getQueue()).toEqual(null);

  msg.setFanoutExchange('my-fanout');
  expect(msg.getExchange()).toEqual({
    ns: 'testing',
    name: 'my-fanout',
    type: EExchangeType.FANOUT,
  });
  expect(msg.getQueue()).toEqual(null);

  msg.setQueue('my-queue');
  expect(msg.getQueue()).toEqual({ ns: 'testing', name: 'my-queue' });
  expect(msg.getExchange()).toEqual(null);

  msg.setQueue('another-queue');
  expect(msg.getQueue()).toEqual({ ns: 'testing', name: 'another-queue' });
  expect(msg.getExchange()).toEqual(null);
});
