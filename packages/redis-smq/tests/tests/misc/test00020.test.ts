/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  EMessagePriority,
  MessageMessagePropertyError,
  ProducibleMessage,
} from '../../../src/lib/index.js';

test('ProducibleMessage', async () => {
  const msg = new ProducibleMessage();
  expect(() => {
    msg.setScheduledRepeatPeriod(-1);
  }).toThrow(MessageMessagePropertyError);
  expect(() => {
    msg.setScheduledDelay(-1);
  }).toThrow(MessageMessagePropertyError);
  expect(() => {
    msg.setScheduledRepeat(-1);
  }).toThrow(MessageMessagePropertyError);
  expect(() => {
    msg.setTTL(-1);
  }).toThrow(MessageMessagePropertyError);
  expect(() => {
    msg.setConsumeTimeout(-1);
  }).toThrow(MessageMessagePropertyError);
  expect(() => {
    msg.setRetryThreshold(-1);
  }).toThrow(MessageMessagePropertyError);
  expect(() => {
    msg.setRetryDelay(-1);
  }).toThrow(MessageMessagePropertyError);

  msg.setPriority(EMessagePriority.HIGHEST);
  expect(msg.getPriority()).toBe(EMessagePriority.HIGHEST);
  expect(msg.hasPriority()).toBe(true);

  msg.disablePriority();
  expect(msg.getPriority()).toBe(null);
  expect(msg.hasPriority()).toBe(false);

  msg.setTopic('my-topic');
  expect(msg.getTopic()).toEqual({ ns: 'testing', topic: 'my-topic' });

  msg.setQueue('my-queue');
  expect(msg.getQueue()).toEqual({ ns: 'testing', name: 'my-queue' });

  msg.setFanOut('my-fanout');
  expect(msg.getFanOut()).toEqual('my-fanout');
});
