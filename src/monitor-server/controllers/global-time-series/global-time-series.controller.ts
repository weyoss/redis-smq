import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { AcknowledgedRequestDTO } from './actions/acknowledged/acknowledged-request.DTO';
import { AcknowledgedHandler } from './actions/acknowledged/acknowledged.handler';
import { DeadLetteredHandler } from './actions/dead-lettered/dead-lettered.handler';
import { DeadLetteredRequestDTO } from './actions/dead-lettered/dead-lettered-request.DTO';
import { DeadLetteredResponseDTO } from './actions/dead-lettered/dead-lettered-response.DTO';
import { PublishedHandler } from './actions/published/published.handler';
import { PublishedRequestDTO } from './actions/published/published-request.DTO';
import { PublishedResponseDTO } from './actions/published/published-response.DTO';
import { AcknowledgedResponseDTO } from './actions/acknowledged/acknowledged-response.DTO';

export const globalTimeSeriesController: TRouteController = {
  prefix: '/time-series',
  actions: [
    {
      path: '/acknowledged',
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
      path: '/dead-lettered',
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
      path: '/published',
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
