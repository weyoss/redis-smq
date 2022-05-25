import { logger } from 'redis-smq-common';

export const setLogger = logger.setLogger;
export { events } from './src/common/events/events';
export { Consumer } from './src/lib/consumer/consumer';
export { Producer } from './src/lib/producer/producer';
export { Message } from './src/lib/message/message';
export { MessageManager } from './src/lib/message-manager/message-manager';
export { QueueManager } from './src/lib/queue-manager/queue-manager';
export {
  registerProducerPlugin,
  registerConsumerPlugin,
} from './src/plugins/plugins';
