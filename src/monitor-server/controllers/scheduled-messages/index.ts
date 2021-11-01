import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { GetScheduledMessagesHandler } from './get-scheduled-messages/get-scheduled-messages.handler';
import { GetScheduledMessagesResponseDTO } from './get-scheduled-messages/get-scheduled-messages-response.DTO';
import { DeleteScheduledMessageRequestDTO } from './delete-scheduled-message/delete-scheduled-message-request.DTO';
import { DeleteScheduledMessageHandler } from './delete-scheduled-message/delete-scheduled-message.handler';
import { DeleteScheduledMessageResponseDTO } from './delete-scheduled-message/delete-scheduled-message-response.DTO';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages/get-scheduled-messages-request.DTO';
import { PurgeScheduledMessagesHandler } from './purge-scheduled-messages/purge-scheduled-messages.handler';
import { PurgeScheduledMessagesRequestDTO } from './purge-scheduled-messages/purge-scheduled-messages-request.DTO';
import { PurgeScheduledMessagesResponseDTO } from './purge-scheduled-messages/purge-scheduled-messages-response.DTO';

export const scheduledMessagesController: TRouteController = {
  prefix: '/scheduled-messages',
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
