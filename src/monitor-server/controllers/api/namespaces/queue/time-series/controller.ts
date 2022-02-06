import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { GetQueueDeadLetteredHandler } from './get-queue-dead-lettered/get-queue-dead-lettered.handler';
import { GetQueueDeadLetteredRequestDTO } from './get-queue-dead-lettered/get-queue-dead-lettered.request.DTO';
import { GetQueueDeadLetteredResponseDTO } from './get-queue-dead-lettered/get-queue-dead-lettered.response.DTO';
import { GetQueueAcknowledgedHandler } from './get-queue-acknowledged/get-queue-acknowledged.handler';
import { GetQueueAcknowledgedRequestDTO } from './get-queue-acknowledged/get-queue-acknowledged.request.DTO';
import { GetQueueAcknowledgedResponseDTO } from './get-queue-acknowledged/get-queue-acknowledged.response.DTO';
import { GetQueuePublishedHandler } from './get-queue-published/get-queue-published.handler';
import { GetQueuePublishedRequestDTO } from './get-queue-published/get-queue-published.request.DTO';
import { GetQueuePublishedResponseDTO } from './get-queue-published/get-queue-published.response.DTO';

export const controller: IRouteController = {
  path: '/time-series',
  actions: [
    {
      path: '/dead-lettered',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetQueueDeadLetteredHandler,
      RequestDTO: GetQueueDeadLetteredRequestDTO,
      ResponseDTO: GetQueueDeadLetteredResponseDTO,
    },
    {
      path: '/acknowledged',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetQueueAcknowledgedHandler,
      RequestDTO: GetQueueAcknowledgedRequestDTO,
      ResponseDTO: GetQueueAcknowledgedResponseDTO,
    },
    {
      path: '/published',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetQueuePublishedHandler,
      RequestDTO: GetQueuePublishedRequestDTO,
      ResponseDTO: GetQueuePublishedResponseDTO,
    },
  ],
};
