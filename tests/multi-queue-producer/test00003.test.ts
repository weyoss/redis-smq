import { MultiQueueProducerMessageRate } from '../../src/system/multi-queue-producer/multi-queue-producer-message-rate';
import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { TimeSeries } from '../../src/system/common/time-series/time-series';

test('MultiQueueProducer: Case 3', async () => {
  const redisClient = await getRedisInstance();
  const messageRate = promisifyAll(
    new MultiQueueProducerMessageRate(`ID_${Date.now()}`, redisClient),
  );
  const ts1 = TimeSeries.getCurrentTimestamp();
  const rateFields1 = messageRate.getRateFields();
  await messageRate.onUpdateAsync(ts1, rateFields1);

  messageRate.incrementPublished({ ns: 'testing', name: 'queue_1' });
  const rateFields2 = messageRate.getRateFields();
  const ts2 = TimeSeries.getCurrentTimestamp();
  await messageRate.onUpdateAsync(ts2, rateFields2);
  await messageRate.quitAsync();
});
