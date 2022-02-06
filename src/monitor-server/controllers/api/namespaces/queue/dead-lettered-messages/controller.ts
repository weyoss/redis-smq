import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { GetDeadLetteredMessagesHandler } from './get-dead-lettered-messages/get-dead-lettered-messages.handler';
import { GetDeadLetteredMessagesRequestDTO } from './get-dead-lettered-messages/get-dead-lettered-messages.request.DTO';
import { GetDeadLetteredMessagesResponseDTO } from './get-dead-lettered-messages/get-dead-lettered-messages.response.DTO';
import { PurgeDeadLetteredMessagesHandler } from './purge-dead-lettered-messages/purge-dead-lettered-messages.handler';
import { PurgeDeadLetteredMessagesRequestDTO } from './purge-dead-lettered-messages/purge-dead-lettered-messages.request.DTO';
import { PurgeDeadLetteredMessagesResponseDTO } from './purge-dead-lettered-messages/purge-dead-lettered-messages.response.DTO';
import { DeleteDeadLetteredMessageHandler } from './delete-dead-lettered-message/delete-dead-lettered-message.handler';
import { DeleteDeadLetteredMessageRequestDTO } from './delete-dead-lettered-message/delete-dead-lettered-message.request.DTO';
import { DeleteDeadLetteredMessageResponseDTO } from './delete-dead-lettered-message/delete-dead-lettered-message.response.DTO';
import { RequeueDeadLetteredMessageHandler } from './requeue-dead-lettered-message/requeue-dead-lettered-message.handler';
import { RequeueDeadLetteredMessageRequestDTO } from './requeue-dead-lettered-message/requeue-dead-lettered-message.request.DTO';
import { RequeueDeadLetteredMessageResponseDTO } from './requeue-dead-lettered-message/requeue-dead-lettered-message.response.DTO';

export const controller: IRouteController = {
  path: '/dead-lettered-messages',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetDeadLetteredMessagesHandler,
      RequestDTO: GetDeadLetteredMessagesRequestDTO,
      ResponseDTO: GetDeadLetteredMessagesResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: PurgeDeadLetteredMessagesHandler,
      RequestDTO: PurgeDeadLetteredMessagesRequestDTO,
      ResponseDTO: PurgeDeadLetteredMessagesResponseDTO,
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
          Handler: DeleteDeadLetteredMessageHandler,
          RequestDTO: DeleteDeadLetteredMessageRequestDTO,
          ResponseDTO: DeleteDeadLetteredMessageResponseDTO,
        },
        {
          path: '/requeue',
          method: ERouteControllerActionMethod.POST,
          payload: [
            ERouteControllerActionPayload.PATH,
            ERouteControllerActionPayload.QUERY,
          ],
          Handler: RequeueDeadLetteredMessageHandler,
          RequestDTO: RequeueDeadLetteredMessageRequestDTO,
          ResponseDTO: RequeueDeadLetteredMessageResponseDTO,
        },
      ],
    },
  ],
};
