import { promisifyAll } from 'bluebird';
import { ProducerMessageRateWriter } from '../../src/system/producer/producer-message-rate-writer';
import { getRedisInstance } from '../common';
import { TimeSeries } from '../../src/system/common/time-series/time-series';
import { ProducerMessageRate } from '../../src/system/producer/producer-message-rate';

test('ProducerMessageRateWriter', async () => {
  const redisClient = await getRedisInstance();
  const messageRateWriter = promisifyAll(
    new ProducerMessageRateWriter(redisClient),
  );
  const messageRate = promisifyAll(new ProducerMessageRate(messageRateWriter));

  const ts1 = TimeSeries.getCurrentTimestamp();
  const rateFields1 = await messageRate.getRateFields();
  await messageRateWriter.onUpdateAsync(ts1, rateFields1);

  messageRate.incrementPublished({ ns: 'testing', name: 'test_queue' });
  const ts2 = TimeSeries.getCurrentTimestamp();
  const rateFields2 = await messageRate.getRateFields();
  await messageRateWriter.onUpdateAsync(ts2, rateFields2);

  await messageRate.quitAsync();
  await messageRateWriter.quitAsync();
});
