import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { GetMultiQueueProducerPublishedHandler } from './get-multi-queue-producer-published/get-multi-queue-producer-published.handler';
import { GetMultiQueueProducerPublishedRequestDTO } from './get-multi-queue-producer-published/get-multi-queue-producer-published.request.DTO';
import { GetMultiQueueProducerPublishedResponseDTO } from './get-multi-queue-producer-published/get-multi-queue-producer-published.response.DTO';

export const controller: IRouteController = {
  path: '/time-series',
  actions: [
    {
      path: '/published',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetMultiQueueProducerPublishedHandler,
      RequestDTO: GetMultiQueueProducerPublishedRequestDTO,
      ResponseDTO: GetMultiQueueProducerPublishedResponseDTO,
    },
  ],
};
