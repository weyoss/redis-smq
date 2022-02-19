import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../lib/routing';
import { DeleteQueueHandler } from './delete-queue/delete-queue.handler';
import { DeleteQueueRequestDTO } from './delete-queue/delete-queue.request.DTO';
import { DeleteQueueResponseDTO } from './delete-queue/delete-queue.response.DTO';
import { controller as queueDeadLetteredMessagesController } from './dead-lettered-messages/controller';
import { controller as queueAcknowledgedMessagesController } from './acknowledged-messages/controller';
import { controller as queuePendingMessagesWithPriorityController } from './pending-messages-with-priority/controller';
import { controller as queuePendingMessagesController } from './pending-messages/controller';
import { controller as queueTimeSeriesController } from './time-series/controller';
import { controller as queueRateLimitingController } from './rate-limiting/controller';

export const queueController: IRouteController = {
  path: '/:queueName',
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
    queueRateLimitingController,
  ],
};
