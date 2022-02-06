import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { PurgePendingMessagesHandler } from './purge-pending-messages/purge-pending-messages.handler';
import { PurgePendingMessagesRequestDTO } from './purge-pending-messages/purge-pending-messages.request.DTO';
import { PurgePendingMessagesResponseDTO } from './purge-pending-messages/purge-pending-messages.response.DTO';
import { GetPendingMessagesHandler } from './get-pending-messages/get-pending-messages.handler';
import { GetPendingMessagesRequestDTO } from './get-pending-messages/get-pending-messages.request.DTO';
import { GetPendingMessagesResponseDTO } from './get-pending-messages/get-pending-messages.response.DTO';
import { DeletePendingMessageHandler } from './delete-pending-message/delete-pending-message.handler';
import { DeletePendingMessageRequestDTO } from './delete-pending-message/delete-pending-message.request.DTO';
import { DeletePendingMessageResponseDTO } from './delete-pending-message/delete-pending-message.response.DTO';

export const controller: IRouteController = {
  path: '/pending-messages',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: PurgePendingMessagesHandler,
      RequestDTO: PurgePendingMessagesRequestDTO,
      ResponseDTO: PurgePendingMessagesResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetPendingMessagesHandler,
      RequestDTO: GetPendingMessagesRequestDTO,
      ResponseDTO: GetPendingMessagesResponseDTO,
    },
    {
      path: '/:id',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: DeletePendingMessageHandler,
      RequestDTO: DeletePendingMessageRequestDTO,
      ResponseDTO: DeletePendingMessageResponseDTO,
    },
  ],
};
