import { MessagesService } from './messages.service';
import { TApplication } from '../types/common';
import { MessageManager } from '../../system/message-manager/message-manager';
import { QueuesService } from './queues.service';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { ConsumerTimeSeriesService } from './consumer-time-series.service';
import { QueueTimeSeriesService } from './queue-time-series.service';
import { GlobalTimeSeriesService } from './global-time-series.service';

export function Services(app: TApplication) {
  const { redis, logger } = app.context;
  let messagesService: MessagesService | null = null;
  let queuesService: QueuesService | null = null;
  let consumerTimeSeriesService: ConsumerTimeSeriesService | null = null;
  let queueTimeSeriesService: QueueTimeSeriesService | null = null;
  let globalTimeSeriesService: GlobalTimeSeriesService | null = null;

  return {
    get messagesService() {
      if (!messagesService) {
        const messageManager = new MessageManager(redis, logger, {});
        messagesService = new MessagesService(messageManager);
      }
      return messagesService;
    },
    get queuesService() {
      if (!queuesService) {
        const queueManager = new QueueManager(redis, logger);
        queuesService = new QueuesService(queueManager);
      }
      return queuesService;
    },
    get consumerTimeSeriesService() {
      if (!consumerTimeSeriesService) {
        consumerTimeSeriesService = new ConsumerTimeSeriesService(redis);
      }
      return consumerTimeSeriesService;
    },
    get queueTimeSeriesService() {
      if (!queueTimeSeriesService) {
        queueTimeSeriesService = new QueueTimeSeriesService(redis);
      }
      return queueTimeSeriesService;
    },
    get globalTimeSeriesService() {
      if (!globalTimeSeriesService) {
        globalTimeSeriesService = new GlobalTimeSeriesService(redis);
      }
      return globalTimeSeriesService;
    },
  };
}
