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

export const consumerTimeSeriesController: TRouteController = {
  prefix: '/ns/:ns/queues/:queueName/consumers/:consumerId',
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
  ],
};
