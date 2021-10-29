import { DeleteScheduledMessageHandler } from './actions/delete-scheduled-message/delete-scheduled-message.handler';
import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
} from '../../lib/routing';
import { DeleteScheduledMessageRequestDTO } from './actions/delete-scheduled-message/delete-scheduled-message-request.DTO';
import { DeleteScheduledMessageResponseDTO } from './actions/delete-scheduled-message/delete-scheduled-message-response.DTO';
import { GetScheduledMessagesRequestDTO } from './actions/get-scheduled-messages/get-scheduled-messages-request.DTO';
import { GetScheduledMessagesResponseDTO } from './actions/get-scheduled-messages/get-scheduled-messages-response.DTO';
import { GetScheduledMessagesHandler } from './actions/get-scheduled-messages/get-scheduled-messages.handler';

export const messagesController = {
  prefix: '/messages',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: ERouteControllerActionPayload.QUERY,
      Handler: GetScheduledMessagesHandler,
      RequestDTO: GetScheduledMessagesRequestDTO,
      ResponseDTO: GetScheduledMessagesResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: ERouteControllerActionPayload.QUERY,
      Handler: DeleteScheduledMessageHandler,
      RequestDTO: DeleteScheduledMessageRequestDTO,
      ResponseDTO: DeleteScheduledMessageResponseDTO,
    },
  ],
};
