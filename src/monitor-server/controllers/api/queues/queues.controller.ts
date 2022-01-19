import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
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
import { controller as queueConsumerTimeSeriesController } from './queue/consumer/time-series/controller';
import { DeleteQueueHandler } from './queue/delete-queue/delete-queue.handler';
import { DeleteQueueRequestDTO } from './queue/delete-queue/delete-queue.request.DTO';
import { DeleteQueueResponseDTO } from './queue/delete-queue/delete-queue.response.DTO';

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
        {
          path: '/',
          method: ERouteControllerActionMethod.DELETE,
          payload: [ERouteControllerActionPayload.PATH],
          Handler: DeleteQueueHandler,
          RequestDTO: DeleteQueueRequestDTO,
          ResponseDTO: DeleteQueueResponseDTO,
        },
        queueDeadLetteredMessagesController,
        queueAcknowledgedMessagesController,
        queuePendingMessagesWithPriorityController,
        queuePendingMessagesController,
        queueTimeSeriesController,
        queueConsumerTimeSeriesController,
      ],
    },
  ],
};
