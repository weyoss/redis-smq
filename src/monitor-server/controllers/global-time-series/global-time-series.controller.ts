import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { AcknowledgedRequestDTO } from './actions/acknowledged/acknowledged-request.DTO';
import { AcknowledgedHandler } from './actions/acknowledged/acknowledged.handler';
import { UnacknowledgedHandler } from './actions/unacknowledged/unacknowledged.handler';
import { UnacknowledgedRequestDTO } from './actions/unacknowledged/unacknowledged-request.DTO';
import { UnacknowledgedResponseDTO } from './actions/unacknowledged/unacknowledged-response.DTO';
import { ProcessingHandler } from './actions/processing/processing.handler';
import { ProcessingRequestDTO } from './actions/processing/processing-request.DTO';
import { ProcessingResponseDTO } from './actions/processing/processing-response.DTO';
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
      path: '/unacknowledged',
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
      path: '/processing',
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
