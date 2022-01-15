import {
  ERouteControllerActionMethod,
  IRouteController,
} from '../../../lib/routing';
import { GetQueuesHandler } from './get-queues/get-queues.handler';
import { GetQueuesRequestDTO } from './get-queues/get-queues.request.DTO';
import { GetQueuesResponseDTO } from './get-queues/get-queues.response.DTO';

import { controller as queueDeadLetteredMessagesController } from './queue/dead-lettered-messages/controller';
import { controller as queueAcknowledgedMessagesController } from './queue/acknowledged-messages/controller';
import { controller as queuePendingMessagesWithPriorityController } from './queue/pending-messages-with-priority/controller';
import { controller as queuePendingMessagesController } from './queue/pending-messages/controller';
import { controller as queueTimeSeriesController } from './queue/time-series/controller';
import { controller as queueProducerTimeSeriesController } from './queue/producer/time-series/controller';
import { controller as queueConsumerTimeSeriesController } from './queue/consumer/time-series/controller';

export const queuesController: IRouteController = {
  path: '/queues',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [],
      Handler: GetQueuesHandler,
      RequestDTO: GetQueuesRequestDTO,
      ResponseDTO: GetQueuesResponseDTO,
    },
    {
      path: '/:queueName/ns/:ns',
      actions: [
        queueDeadLetteredMessagesController,
        queueAcknowledgedMessagesController,
        queuePendingMessagesWithPriorityController,
        queuePendingMessagesController,
        queueTimeSeriesController,
        queueProducerTimeSeriesController,
        queueConsumerTimeSeriesController,
      ],
    },
  ],
};
