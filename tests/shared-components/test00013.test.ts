import { ProducerMessageRate } from '../../src/system/producer/producer-message-rate';
import { promisifyAll } from 'bluebird';
import { events } from '../../src/system/common/events';
import { IMultiQueueProducerMessageRateFields } from '../../types';
import { ProducerMessageRateWriter } from '../../src/system/producer/producer-message-rate-writer';
import { getRedisInstance } from '../common';

test('ProducerMessageRate', async () => {
  const redisClient = await getRedisInstance();
  const messageRateWriter = new ProducerMessageRateWriter(redisClient);
  const messageRate = promisifyAll(new ProducerMessageRate(messageRateWriter));

  const rateFields1 = await new Promise<{
    ts: number;
    rateFields: IMultiQueueProducerMessageRateFields;
  }>((resolve) => {
    messageRate.once(
      events.RATE_TICK,
      (ts: number, rateFields: IMultiQueueProducerMessageRateFields) => {
        resolve({ ts, rateFields });
      },
    );
  });
  expect(typeof rateFields1.ts).toBe('number');
  expect(typeof rateFields1.rateFields.publishedRate).toBe('number');
  expect(rateFields1.rateFields.queuePublishedRate).toEqual({});

  messageRate.incrementPublished({ ns: 'testing', name: 'queue_1' });
  const rateFields2 = await new Promise<{
    ts: number;
    rateFields: IMultiQueueProducerMessageRateFields;
  }>((resolve) => {
    messageRate.once(
      events.RATE_TICK,
      (ts: number, rateFields: IMultiQueueProducerMessageRateFields) => {
        resolve({ ts, rateFields });
      },
    );
  });
  expect(typeof rateFields2.ts).toBe('number');
  expect(typeof rateFields2.rateFields.publishedRate).toBe('number');
  expect(
    typeof rateFields2.rateFields.queuePublishedRate[`testing:queue_1`],
  ).toEqual('number');

  await messageRate.quitAsync();
});
