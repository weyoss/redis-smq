import { Message } from '../../../src/lib/message/message';
import { DestinationQueueRequiredError } from '../../../src/lib/exchange/errors/destination-queue-required.error';
import { MessageExchangeRequiredError } from '../../../src/lib/message/errors/message-exchange-required.error';

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
  }).toThrow(MessageExchangeRequiredError);
  msg.setQueue('test1');
  expect(() => {
    msg.getDestinationQueue();
  }).toThrow(DestinationQueueRequiredError);
  expect(msg.hasNextDelay()).toBe(false);
  expect(msg.hasRetryThresholdExceeded()).toBe(false);
});
