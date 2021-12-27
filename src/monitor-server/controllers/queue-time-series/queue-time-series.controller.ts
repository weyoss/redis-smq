import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { AcknowledgedHandler } from './actions/acknowledged/acknowledged.handler';
import { AcknowledgedRequestDTO } from './actions/acknowledged/acknowledged-request.DTO';
import { AcknowledgedResponseDTO } from './actions/acknowledged/acknowledged-response.DTO';
import { DeadLetteredHandler } from './actions/dead-lettered/dead-lettered.handler';
import { DeadLetteredRequestDTO } from './actions/dead-lettered/dead-lettered-request.DTO';
import { DeadLetteredResponseDTO } from './actions/dead-lettered/dead-lettered-response.DTO';
import { PublishedHandler } from './actions/published/published.handler';
import { PublishedRequestDTO } from './actions/published/published-request.DTO';
import { PublishedResponseDTO } from './actions/published/published-response.DTO';

export const queueTimeSeriesController: TRouteController = {
  prefix: '/ns/:ns/queues/:queueName',
  actions: [
    {
      path: '/acknowledged-time-series',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: AcknowledgedHandler,
      RequestDTO: AcknowledgedRequestDTO,
      ResponseDTO: AcknowledgedResponseDTO,
    },
    {
      path: '/dead-lettered-time-series',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: DeadLetteredHandler,
      RequestDTO: DeadLetteredRequestDTO,
      ResponseDTO: DeadLetteredResponseDTO,
    },
    {
      path: '/published-time-series',
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
