import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { GetPendingMessagesWithPriorityHandler } from './get-pending-messages-with-priority/get-pending-messages-with-priority.handler';
import { GetPendingMessagesWithPriorityRequestDTO } from './get-pending-messages-with-priority/get-pending-messages-with-priority.request.DTO';
import { GetPendingMessagesWithPriorityResponseDTO } from './get-pending-messages-with-priority/get-pending-messages-with-priority.response.DTO';
import { PurgePendingMessagesWithPriorityHandler } from './purge-pending-messages-with-priority/purge-pending-messages-with-priority.handler';
import { PurgePendingMessagesWithPriorityRequestDTO } from './purge-pending-messages-with-priority/purge-pending-messages-with-priority.request.DTO';
import { PurgePendingMessagesWithPriorityResponseDTO } from './purge-pending-messages-with-priority/purge-pending-messages-with-priority.response.DTO';
import { DeletePendingMessageWithPriorityHandler } from './delete-pending-message-with-priority/delete-pending-message-with-priority.handler';
import { DeletePendingMessageWithPriorityRequestDTO } from './delete-pending-message-with-priority/delete-pending-message-with-priority.request.DTO';
import { DeletePendingMessageWithPriorityResponseDTO } from './delete-pending-message-with-priority/delete-pending-message-with-priority.response.DTO';

export const controller: IRouteController = {
  path: '/pending-messages-with-priority',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetPendingMessagesWithPriorityHandler,
      RequestDTO: GetPendingMessagesWithPriorityRequestDTO,
      ResponseDTO: GetPendingMessagesWithPriorityResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: PurgePendingMessagesWithPriorityHandler,
      RequestDTO: PurgePendingMessagesWithPriorityRequestDTO,
      ResponseDTO: PurgePendingMessagesWithPriorityResponseDTO,
    },
    {
      path: '/:id',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: DeletePendingMessageWithPriorityHandler,
      RequestDTO: DeletePendingMessageWithPriorityRequestDTO,
      ResponseDTO: DeletePendingMessageWithPriorityResponseDTO,
    },
  ],
};
