import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { AcknowledgedHandler } from './actions/acknowledged/acknowledged.handler';
import { AcknowledgedRequestDTO } from './actions/acknowledged/acknowledged-request.DTO';
import { AcknowledgedResponseDTO } from './actions/acknowledged/acknowledged-response.DTO';
import { UnacknowledgedHandler } from './actions/unacknowledged/unacknowledged.handler';
import { UnacknowledgedRequestDTO } from './actions/unacknowledged/unacknowledged-request.DTO';
import { UnacknowledgedResponseDTO } from './actions/unacknowledged/unacknowledged-response.DTO';
import { ProcessingHandler } from './actions/processing/processing.handler';
import { ProcessingRequestDTO } from './actions/processing/processing-request.DTO';
import { ProcessingResponseDTO } from './actions/processing/processing-response.DTO';
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
      path: '/unacknowledged-time-series',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: UnacknowledgedHandler,
      RequestDTO: UnacknowledgedRequestDTO,
      ResponseDTO: UnacknowledgedResponseDTO,
    },
    {
      path: '/processing-time-series',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: ProcessingHandler,
      RequestDTO: ProcessingRequestDTO,
      ResponseDTO: ProcessingResponseDTO,
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
