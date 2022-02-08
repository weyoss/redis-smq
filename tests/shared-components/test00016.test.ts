import { delay } from 'bluebird';
import {
  defaultQueue,
  getConsumer,
  setUpMessageQueue,
  startTimeSeriesWorker,
} from '../common';

test('TimeSeriesWorker', async () => {
  await startTimeSeriesWorker();
  await delay(5000);
  await setUpMessageQueue(defaultQueue);
  await delay(5000);
  const consumer = await getConsumer({ queue: defaultQueue });
  await consumer.runAsync();
  await delay(5000);
});
