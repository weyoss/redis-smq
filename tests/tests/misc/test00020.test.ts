/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../src/lib/message/message-envelope';
import { MessageDestinationQueueRequiredError } from '../../../src/lib/message/errors';

test('MessageEnvelope: validations', async () => {
  const msg = new MessageEnvelope();
  expect(() => {
    msg.getRequiredId();
  }).toThrow('Message has not yet been published');
  expect(() => {
    msg.setScheduledRepeatPeriod(-1);
  }).toThrow('Expected a positive integer value in milliseconds');
  expect(() => {
    msg.setScheduledDelay(-1);
  }).toThrow('Expected a positive integer value in milliseconds');
  expect(() => {
    msg.setScheduledRepeat(-1);
  }).toThrow('Expected a positive integer value >= 0');
  expect(() => {
    msg.setTTL(-1);
  }).toThrow('Expected a positive integer value in milliseconds >= 0');
  expect(() => {
    msg.setConsumeTimeout(-1);
  }).toThrow('Expected a positive integer value in milliseconds >= 0');
  expect(() => {
    msg.setRetryThreshold(-1);
  }).toThrow('Retry threshold should be a positive integer >= 0');
  expect(() => {
    msg.setRetryDelay(-1);
  }).toThrow('Expected a positive integer in milliseconds >= 0');
  expect(() => {
    msg.getDestinationQueue();
  }).toThrow(MessageDestinationQueueRequiredError);
  msg.setQueue('test1');
  expect(() => {
    msg.getDestinationQueue();
  }).toThrow(MessageDestinationQueueRequiredError);
  expect(msg.hasNextDelay()).toBe(false);
  expect(msg.hasRetryThresholdExceeded()).toBe(false);
});
