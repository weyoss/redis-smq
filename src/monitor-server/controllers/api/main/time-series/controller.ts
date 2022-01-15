import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../lib/routing';
import { GetDeadLetteredHandler } from './get-dead-lettered/get-dead-lettered.handler';
import { GetDeadLetteredRequestDTO } from './get-dead-lettered/get-dead-lettered.request.DTO';
import { GetDeadLetteredResponseDTO } from './get-dead-lettered/get-dead-lettered.response.DTO';
import { GetAcknowledgedHandler } from './get-acknowledged/get-acknowledged.handler';
import { GetAcknowledgedRequestDTO } from './get-acknowledged/get-acknowledged.request.DTO';
import { GetAcknowledgedResponseDTO } from './get-acknowledged/get-acknowledged.response.DTO';
import { GetPublishedHandler } from './get-published-time-series/get-published.handler';
import { GetPublishedRequestDTO } from './get-published-time-series/get-published.request.DTO';
import { GetPublishedResponseDTO } from './get-published-time-series/get-published.response.DTO';

export const controller: IRouteController = {
  path: '/time-series',
  actions: [
    {
      path: '/acknowledged',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetAcknowledgedHandler,
      RequestDTO: GetAcknowledgedRequestDTO,
      ResponseDTO: GetAcknowledgedResponseDTO,
    },
    {
      path: '/dead-lettered',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetDeadLetteredHandler,
      RequestDTO: GetDeadLetteredRequestDTO,
      ResponseDTO: GetDeadLetteredResponseDTO,
    },
    {
      path: '/published',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetPublishedHandler,
      RequestDTO: GetPublishedRequestDTO,
      ResponseDTO: GetPublishedResponseDTO,
    },
  ],
};
