import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { GetConsumerAcknowledgedHandler } from './get-consumer-acknowledged/get-consumer-acknowledged.handler';
import { GetConsumerAcknowledgedRequestDTO } from './get-consumer-acknowledged/get-consumer-acknowledged.request.DTO';
import { GetConsumerAcknowledgedResponseDTO } from './get-consumer-acknowledged/get-consumer-acknowledged.response.DTO';
import { GetConsumerDeadLetteredHandler } from './get-consumer-dead-lettered/get-consumer-dead-lettered.handler';
import { GetConsumerDeadLetteredRequestDTO } from './get-consumer-dead-lettered/get-consumer-dead-lettered.request.DTO';
import { GetConsumerDeadLetteredResponseDTO } from './get-consumer-dead-lettered/get-consumer-dead-lettered.response.DTO';

export const controller: IRouteController = {
  path: '/:consumerId',
  actions: [
    {
      path: '/time-series',
      actions: [
        {
          path: '/acknowledged',
          method: ERouteControllerActionMethod.GET,
          payload: [
            ERouteControllerActionPayload.PATH,
            ERouteControllerActionPayload.QUERY,
          ],
          Handler: GetConsumerAcknowledgedHandler,
          RequestDTO: GetConsumerAcknowledgedRequestDTO,
          ResponseDTO: GetConsumerAcknowledgedResponseDTO,
        },
        {
          path: '/dead-lettered',
          method: ERouteControllerActionMethod.GET,
          payload: [
            ERouteControllerActionPayload.PATH,
            ERouteControllerActionPayload.QUERY,
          ],
          Handler: GetConsumerDeadLetteredHandler,
          RequestDTO: GetConsumerDeadLetteredRequestDTO,
          ResponseDTO: GetConsumerDeadLetteredResponseDTO,
        },
      ],
    },
  ],
};
