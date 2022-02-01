import { promisifyAll } from 'bluebird';
import { ProducerMessageRateWriter } from '../../src/system/app/producer/producer-message-rate-writer';
import { getRedisInstance } from '../common';
import { ProducerMessageRate } from '../../src/system/app/producer/producer-message-rate';
import { IProducerMessageRateFields } from '../../types';

test('ProducerMessageRate/ProducerMessageRateWriter: case 1', async () => {
  const redisClient = await getRedisInstance();
  const messageRateWriter = promisifyAll(
    new ProducerMessageRateWriter(redisClient),
  );
  const messageRate = promisifyAll(new ProducerMessageRate(messageRateWriter));

  const r = await new Promise<{
    ts: number;
    rateFields: IProducerMessageRateFields;
  }>((resolve) => {
    const orig = messageRateWriter.onUpdate;
    messageRateWriter.onUpdate = function (ts, rateFields, cb) {
      orig.call(this, ts, rateFields, (err) => {
        cb(err);
        messageRateWriter.onUpdate = orig;
        resolve({ ts, rateFields });
      });
    };
  });
  expect(typeof r.ts).toBe('number');
  expect(typeof r.rateFields.publishedRate).toBe('number');
  expect(r.rateFields.queuePublishedRate).toEqual({});

  messageRate.incrementPublished({ ns: 'testing', name: 'test_queue' });
  const r2 = await new Promise<{
    ts: number;
    rateFields: IProducerMessageRateFields;
  }>((resolve) => {
    const orig = messageRateWriter.onUpdate;
    messageRateWriter.onUpdate = function (ts, rateFields, cb) {
      orig.call(this, ts, rateFields, (err) => {
        cb(err);
        messageRateWriter.onUpdate = orig;
        resolve({ ts, rateFields });
      });
    };
  });
  expect(typeof r2.ts).toBe('number');
  expect(typeof r2.rateFields.publishedRate).toBe('number');
  expect(typeof r2.rateFields.queuePublishedRate[`testing:test_queue`]).toEqual(
    'number',
  );

  await messageRate.quitAsync();
});
