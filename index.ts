import { logger } from 'redis-smq-common';

export const setLogger = logger.setLogger;
export { Consumer } from './src/lib/consumer/consumer';
export { Producer } from './src/lib/producer/producer';
export { Message } from './src/lib/message/message';
export { MessageManager } from './src/lib/message-manager/message-manager';
export { QueueManager } from './src/lib/queue-manager/queue-manager';
export { setConfiguration } from './src/config/configuration';
export {
  registerProducerPlugin,
  registerConsumerPlugin,
} from './src/plugins/plugins';
