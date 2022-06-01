import { IConfig } from '../../types';
import { Producer } from '../../src/lib/producer/producer';
import { promisifyAll } from 'bluebird';
import { events } from '../../src/common/events/events';
import { requiredConfig } from './config';

const producersList: Producer[] = [];

export function getProducer(cfg: IConfig = requiredConfig) {
  const producer = new Producer(cfg);
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function shutDownProducers() {
  for (const i of producersList) {
    if (i.isGoingUp()) {
      await new Promise((resolve) => {
        i.once(events.UP, resolve);
      });
    }
    if (i.isRunning()) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        i.shutdown(resolve);
      });
    }
  }
}
