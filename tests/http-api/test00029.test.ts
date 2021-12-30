import { getProducer, validateTimeSeriesFrom } from '../common';
import { delay, promisifyAll } from 'bluebird';

test('Producer published time series', async () => {
  const producer = promisifyAll(getProducer());
  const queue = producer.getQueue();
  await delay(5000);
  await validateTimeSeriesFrom(
    `/api/ns/${queue.ns}/queues/${
      queue.name
    }/producers/${producer.getId()}/published-time-series`,
  );
});