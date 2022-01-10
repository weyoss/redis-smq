import { MultiQueueProducerMessageRate } from '../../src/system/multi-queue-producer/multi-queue-producer-message-rate';
import { promisifyAll } from 'bluebird';
import { MultiQueueProducerMessageRateWriter } from '../../src/system/multi-queue-producer/multi-queue-producer-message-rate-writer';
import { getRedisInstance } from '../common';
import { TimeSeries } from '../../src/system/common/time-series/time-series';

test('MultiQueueProducerMessageRateWriter', async () => {
  const redisClient = await getRedisInstance();
  const messageRate = promisifyAll(new MultiQueueProducerMessageRate());

  const messageRateWriter = promisifyAll(
    new MultiQueueProducerMessageRateWriter(
      redisClient,
      `ID_${Date.now()}`,
      messageRate,
    ),
  );

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
