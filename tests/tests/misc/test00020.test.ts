import { Message } from '../../../src/lib/message/message';
import { MessageDestinationQueueRequiredError } from '../../../src/lib/message/errors';

test('Message: validations', async () => {
  const msg = new Message();
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
    msg.setPriority(-100);
  }).toThrow('Invalid message priority.');
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
