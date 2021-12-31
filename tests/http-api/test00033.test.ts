import { validateTimeSeriesFrom } from '../common';
import { delay, promisifyAll } from 'bluebird';
import { MultiQueueProducer } from '../../src/multi-queue-producer';
import { config } from '../config';

test('MultiQueueProducer published time series', async () => {
  const producer = promisifyAll(new MultiQueueProducer(config));
  await delay(5000);
  await validateTimeSeriesFrom(
    `/api/multi-queue-producers/${producer.getId()}/published-time-series`,
  );
  await producer.shutdownAsync();
});
