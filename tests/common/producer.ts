import { IConfig } from '../../types';
import { Producer } from '../../src/lib/producer/producer';
import { promisifyAll } from 'bluebird';
import { requiredConfig } from './config';
import { shutDownBaseInstance } from './base-instance';

const producersList: Producer[] = [];

export function getProducer(cfg: IConfig = requiredConfig) {
  const producer = new Producer(cfg);
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function shutDownProducers() {
  for (const i of producersList) await shutDownBaseInstance(i);
}
