import { Producer } from '../../src/lib/producer/producer';
import { promisifyAll } from 'bluebird';
import { shutDownBaseInstance } from './base-instance';

const producersList: Producer[] = [];

export function getProducer() {
  const producer = new Producer();
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function shutDownProducers() {
  for (const i of producersList) await shutDownBaseInstance(i);
}
