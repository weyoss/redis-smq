import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetPendingMessagesWithPriorityRequestDTO } from './get-pending-messages-with-priority.request.DTO';
import { GetPendingMessagesWithPriorityResponseDTO } from './get-pending-messages-with-priority.response.DTO';

export const GetPendingMessagesWithPriorityHandler: TRouteControllerActionHandler<
  GetPendingMessagesWithPriorityRequestDTO,
  GetPendingMessagesWithPriorityResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.getPendingMessagesWithPriority(ctx.state.dto);
  };
};
