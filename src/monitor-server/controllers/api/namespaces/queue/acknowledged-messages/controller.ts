import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { GetAcknowledgedMessagesHandler } from './get-acknowledged-messages/get-acknowledged-messages.handler';
import { GetAcknowledgedMessagesRequestDTO } from './get-acknowledged-messages/get-acknowledged-messages.request.DTO';
import { GetAcknowledgedMessagesResponseDTO } from './get-acknowledged-messages/get-acknowledged-messages.response.DTO';
import { PurgeAcknowledgedMessagesHandler } from './purge-acknowledged-messages/purge-acknowledged-messages.handler';
import { PurgeAcknowledgedMessagesRequestDTO } from './purge-acknowledged-messages/purge-acknowledged-messages.request.DTO';
import { PurgeAcknowledgedMessagesResponseDTO } from './purge-acknowledged-messages/purge-acknowledged-messages.response.DTO';
import { DeleteAcknowledgedMessageHandler } from './delete-acknowledged-message/delete-acknowledged-message.handler';
import { DeleteAcknowledgedMessageRequestDTO } from './delete-acknowledged-message/delete-acknowledged-message.request.DTO';
import { DeleteAcknowledgedMessageResponseDTO } from './delete-acknowledged-message/delete-acknowledged-message.response.DTO';
import { RequeueAcknowledgedMessageHandler } from './requeue-acknowledged-message/requeue-acknowledged-message.handler';
import { RequeueAcknowledgedMessageRequestDTO } from './requeue-acknowledged-message/requeue-acknowledged-message.request.DTO';
import { RequeueAcknowledgedMessageResponseDTO } from './requeue-acknowledged-message/requeue-acknowledged-message.response.DTO';

export const controller: IRouteController = {
  path: '/acknowledged-messages',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetAcknowledgedMessagesHandler,
      RequestDTO: GetAcknowledgedMessagesRequestDTO,
      ResponseDTO: GetAcknowledgedMessagesResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: PurgeAcknowledgedMessagesHandler,
      RequestDTO: PurgeAcknowledgedMessagesRequestDTO,
      ResponseDTO: PurgeAcknowledgedMessagesResponseDTO,
    },
    {
      path: '/:id',
      actions: [
        {
          path: '/',
          method: ERouteControllerActionMethod.DELETE,
          payload: [
            ERouteControllerActionPayload.PATH,
            ERouteControllerActionPayload.QUERY,
          ],
          Handler: DeleteAcknowledgedMessageHandler,
          RequestDTO: DeleteAcknowledgedMessageRequestDTO,
          ResponseDTO: DeleteAcknowledgedMessageResponseDTO,
        },
        {
          path: '/requeue',
          method: ERouteControllerActionMethod.POST,
          payload: [
            ERouteControllerActionPayload.PATH,
            ERouteControllerActionPayload.QUERY,
          ],
          Handler: RequeueAcknowledgedMessageHandler,
          RequestDTO: RequeueAcknowledgedMessageRequestDTO,
          ResponseDTO: RequeueAcknowledgedMessageResponseDTO,
        },
      ],
    },
  ],
};
