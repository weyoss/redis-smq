import { IConfig, TConsumerMessageHandler, TQueueParams } from '../../types';
import { promisifyAll } from 'bluebird';
import { Consumer } from '../../src/lib/consumer/consumer';
import { events } from '../../src/common/events/events';
import { defaultQueue } from './message-producing-consuming';
import { requiredConfig } from './config';

type TGetConsumerArgs = {
  queue?: string | TQueueParams;
  messageHandler?: TConsumerMessageHandler;
  cfg?: IConfig;
};

const consumersList: Consumer[] = [];

export function getConsumer(args: TGetConsumerArgs = {}) {
  const {
    queue = defaultQueue,
    messageHandler = (msg, cb) => cb(),
    cfg = requiredConfig,
  } = args;
  const consumer = promisifyAll(new Consumer(cfg));
  consumer.consume(queue, messageHandler, () => void 0);
  consumersList.push(consumer);
  return consumer;
}

export async function shutDownConsumers() {
  for (const i of consumersList) {
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
