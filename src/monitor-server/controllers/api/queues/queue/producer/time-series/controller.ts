import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../../lib/routing';
import { GetProducerPublishedRequestDTO } from './get-producer-published/get-producer-published.request.DTO';
import { GetProducerPublishedResponseDTO } from './get-producer-published/get-producer-published.response.DTO';
import { GetProducerPublishedHandler } from './get-producer-published/get-producer-published.handler';

export const controller: IRouteController = {
  path: '/producers/:producerId',
  actions: [
    {
      path: '/time-series',
      actions: [
        {
          path: '/published',
          method: ERouteControllerActionMethod.GET,
          payload: [
            ERouteControllerActionPayload.PATH,
            ERouteControllerActionPayload.QUERY,
          ],
          Handler: GetProducerPublishedHandler,
          RequestDTO: GetProducerPublishedRequestDTO,
          ResponseDTO: GetProducerPublishedResponseDTO,
        },
      ],
    },
  ],
};
