import { ProducerMessageRate } from '../../src/system/producer/producer-message-rate';
import { promisifyAll } from 'bluebird';
import { events } from '../../src/system/common/events';
import { IMultiQueueProducerMessageRateFields } from '../../types';

test('ProducerMessageRate', async () => {
  const messageRate = promisifyAll(new ProducerMessageRate());

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
