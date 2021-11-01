import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  TRouteController,
} from '../../lib/routing';
import { GetPendingMessagesRequestDTO } from './actions/get-pending-messages/get-pending-messages-request.DTO';
import { GetPendingMessagesResponseDTO } from './actions/get-pending-messages/get-pending-messages-response.DTO';
import { GetPendingMessagesHandler } from './actions/get-pending-messages/get-pending-messages.handler';
import { GetAcknowledgedMessagesHandler } from './actions/get-acknowledged-messages/get-acknowledged-messages.handler';
import { GetAcknowledgedMessagesRequestDTO } from './actions/get-acknowledged-messages/get-acknowledged-messages-request.DTO';
import { GetAcknowledgedMessagesResponseDTO } from './actions/get-acknowledged-messages/get-acknowledged-messages-response.DTO';
import { GetPendingMessagesWithPriorityRequestDTO } from './actions/get-pending-messages-with-priority/get-pending-messages-with-priority-request.DTO';
import { GetPendingMessagesWithPriorityResponseDTO } from './actions/get-pending-messages-with-priority/get-pending-messages-with-priority-response.DTO';
import { GetDeadLetteredMessagesHandler } from './actions/get-dead-lettered-messages/get-dead-lettered-messages.handler';
import { GetDeadLetteredMessagesRequestDTO } from './actions/get-dead-lettered-messages/get-dead-lettered-messages-request.DTO';
import { GetDeadLetteredMessagesResponseDTO } from './actions/get-dead-lettered-messages/get-dead-lettered-messages-response.DTO';
import { DeletePendingMessageHandler } from './actions/delete-pending-message/delete-pending-message.handler';
import { DeletePendingMessageRequestDTO } from './actions/delete-pending-message/delete-pending-message-request.DTO';
import { DeletePendingMessageResponseDTO } from './actions/delete-pending-message/delete-pending-message-response.DTO';
import { DeleteAcknowledgedMessageHandler } from './actions/delete-acknowledged-message/delete-acknowledged-message.handler';
import { DeleteAcknowledgedMessageRequestDTO } from './actions/delete-acknowledged-message/delete-acknowledged-message-request.DTO';
import { DeleteAcknowledgedMessageResponseDTO } from './actions/delete-acknowledged-message/delete-acknowledged-message-response.DTO';
import { DeletePendingMessageWithPriorityHandler } from './actions/delete-pending-message-with-priority/delete-pending-message-with-priority.handler';
import { DeletePendingMessageWithPriorityRequestDTO } from './actions/delete-pending-message-with-priority/delete-pending-message-with-priority-request.DTO';
import { DeletePendingMessageWithPriorityResponseDTO } from './actions/delete-pending-message-with-priority/delete-pending-message-with-priority-response.DTO';
import { DeleteDeadLetteredMessageHandler } from './actions/delete-dead-lettered-message/delete-dead-lettered-message.handler';
import { DeleteDeadLetteredMessageRequestDTO } from './actions/delete-dead-lettered-message/delete-dead-lettered-message-request.DTO';
import { DeleteDeadLetteredMessageResponseDTO } from './actions/delete-dead-lettered-message/delete-dead-lettered-message-response.DTO';
import { PurgePendingMessagesHandler } from './actions/purge-pending-messages/purge-pending-messages.handler';
import { PurgePendingMessagesRequestDTO } from './actions/purge-pending-messages/purge-pending-messages-request.DTO';
import { PurgePendingMessagesResponseDTO } from './actions/purge-pending-messages/purge-pending-messages-response.DTO';
import { PurgeAcknowledgedMessagesHandler } from './actions/purge-acknowledged-messages/purge-acknowledged-messages.handler';
import { PurgeAcknowledgedMessagesRequestDTO } from './actions/purge-acknowledged-messages/purge-acknowledged-messages-request.DTO';
import { PurgeAcknowledgedMessagesResponseDTO } from './actions/purge-acknowledged-messages/purge-acknowledged-messages-response.DTO';
import { PurgePriorityMessagesHandler } from './actions/purge-priority-messages/purge-priority-messages.handler';
import { PurgePriorityMessagesRequestDTO } from './actions/purge-priority-messages/purge-priority-messages-request.DTO';
import { PurgePriorityMessagesResponseDTO } from './actions/purge-priority-messages/purge-priority-messages-response.DTO';
import { PurgeDeadLetteredMessagesHandler } from './actions/purge-dead-letter-messages/purge-dead-lettered-messages.handler';
import { PurgeDeadLetteredMessagesRequestDTO } from './actions/purge-dead-letter-messages/purge-dead-lettered-messages-request.DTO';
import { PurgeDeadLetteredMessagesResponseDTO } from './actions/purge-dead-letter-messages/purge-dead-lettered-messages-response.DTO';

export const messagesController: TRouteController = {
  prefix: '/queues/:queueName',
  actions: [
    {
      path: '/pending-messages',
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
      path: '/acknowledged-messages',
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
      path: '/pending-messages-with-priority',
      method: ERouteControllerActionMethod.GET,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: GetPendingMessagesHandler,
      RequestDTO: GetPendingMessagesWithPriorityRequestDTO,
      ResponseDTO: GetPendingMessagesWithPriorityResponseDTO,
    },
    {
      path: '/dead-lettered-messages',
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
      path: '/pending-messages/:id',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: DeletePendingMessageHandler,
      RequestDTO: DeletePendingMessageRequestDTO,
      ResponseDTO: DeletePendingMessageResponseDTO,
    },
    {
      path: '/acknowledged-messages/:id',
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
      path: '/pending-messages-with-priority/:id',
      method: ERouteControllerActionMethod.DELETE,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.QUERY,
      ],
      Handler: DeletePendingMessageWithPriorityHandler,
      RequestDTO: DeletePendingMessageWithPriorityRequestDTO,
      ResponseDTO: DeletePendingMessageWithPriorityResponseDTO,
    },
    {
      path: '/dead-lettered-messages/:id',
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
      path: '/pending-messages',
      method: ERouteControllerActionMethod.DELETE,
      payload: [ERouteControllerActionPayload.PATH],
      Handler: PurgePendingMessagesHandler,
      RequestDTO: PurgePendingMessagesRequestDTO,
      ResponseDTO: PurgePendingMessagesResponseDTO,
    },
    {
      path: '/acknowledged-messages',
      method: ERouteControllerActionMethod.DELETE,
      payload: [ERouteControllerActionPayload.PATH],
      Handler: PurgeAcknowledgedMessagesHandler,
      RequestDTO: PurgeAcknowledgedMessagesRequestDTO,
      ResponseDTO: PurgeAcknowledgedMessagesResponseDTO,
    },
    {
      path: '/pending-messages-with-priority',
      method: ERouteControllerActionMethod.DELETE,
      payload: [ERouteControllerActionPayload.PATH],
      Handler: PurgePriorityMessagesHandler,
      RequestDTO: PurgePriorityMessagesRequestDTO,
      ResponseDTO: PurgePriorityMessagesResponseDTO,
    },
    {
      path: '/dead-lettered-messages',
      method: ERouteControllerActionMethod.DELETE,
      payload: [ERouteControllerActionPayload.PATH],
      Handler: PurgeDeadLetteredMessagesHandler,
      RequestDTO: PurgeDeadLetteredMessagesRequestDTO,
      ResponseDTO: PurgeDeadLetteredMessagesResponseDTO,
    },
  ],
};
