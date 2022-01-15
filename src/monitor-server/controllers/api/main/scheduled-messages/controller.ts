import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../lib/routing';
import { GetScheduledMessagesHandler } from './get-scheduled-messages/get-scheduled-messages.handler';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages/get-scheduled-messages.request.DTO';
import { GetScheduledMessagesResponseDTO } from './get-scheduled-messages/get-scheduled-messages.response.DTO';
import { DeleteScheduledMessageHandler } from './delete-scheduled-message/delete-scheduled-message.handler';
import { DeleteScheduledMessageRequestDTO } from './delete-scheduled-message/delete-scheduled-message-request.DTO';
import { DeleteScheduledMessageResponseDTO } from './delete-scheduled-message/delete-scheduled-message-response.DTO';
import { PurgeScheduledMessagesHandler } from './purge-scheduled-messages/purge-scheduled-messages.handler';
import { PurgeScheduledMessagesRequestDTO } from './purge-scheduled-messages/purge-scheduled-messages.request.DTO';
import { PurgeScheduledMessagesResponseDTO } from './purge-scheduled-messages/purge-scheduled-messages.response.DTO';

export const controller: IRouteController = {
  path: '/scheduled-messages',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [ERouteControllerActionPayload.QUERY],
      Handler: GetScheduledMessagesHandler,
      RequestDTO: GetScheduledMessagesRequestDTO,
      ResponseDTO: GetScheduledMessagesResponseDTO,
    },
    {
      path: '/:id',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: DeleteScheduledMessageHandler,
      RequestDTO: DeleteScheduledMessageRequestDTO,
      ResponseDTO: DeleteScheduledMessageResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: [],
      Handler: PurgeScheduledMessagesHandler,
      RequestDTO: PurgeScheduledMessagesRequestDTO,
      ResponseDTO: PurgeScheduledMessagesResponseDTO,
    },
  ],
};
