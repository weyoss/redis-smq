import { TConsumerMessageHandler, IQueueParams } from '../../types';
import { promisifyAll } from 'bluebird';
import { Consumer } from '../../src/lib/consumer/consumer';
import { defaultQueue } from './message-producing-consuming';
import { shutDownBaseInstance } from './base-instance';

type TGetConsumerArgs = {
  queue?: string | IQueueParams;
  messageHandler?: TConsumerMessageHandler;
};

const consumersList: Consumer[] = [];

export function getConsumer(args: TGetConsumerArgs = {}) {
  const { queue = defaultQueue, messageHandler = (msg, cb) => cb() } = args;
  const consumer = promisifyAll(new Consumer());
  consumer.consume(queue, messageHandler, () => void 0);
  consumersList.push(consumer);
  return consumer;
}

export async function shutDownConsumers() {
  for (const i of consumersList) await shutDownBaseInstance(i);
}
