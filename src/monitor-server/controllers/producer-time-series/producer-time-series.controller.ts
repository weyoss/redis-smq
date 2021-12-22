import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { PublishedHandler } from './actions/published/published.handler';
import { PublishedRequestDTO } from './actions/published/published-request.DTO';
import { PublishedResponseDTO } from './actions/published/published-response.DTO';

export const producerTimeSeriesController: TRouteController = {
  prefix: '/ns/:ns/queues/:queueName',
  actions: [
    {
      path: '/producers/:producerId/published-time-series',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: PublishedHandler,
      RequestDTO: PublishedRequestDTO,
      ResponseDTO: PublishedResponseDTO,
    },
  ],
};
