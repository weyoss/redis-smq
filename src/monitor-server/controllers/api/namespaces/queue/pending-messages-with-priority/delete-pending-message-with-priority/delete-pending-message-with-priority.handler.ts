import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeletePendingMessageWithPriorityRequestDTO } from './delete-pending-message-with-priority.request.DTO';
import { DeletePendingMessageWithPriorityResponseDTO } from './delete-pending-message-with-priority.response.DTO';

export const DeletePendingMessageWithPriorityHandler: TRouteControllerActionHandler<
  DeletePendingMessageWithPriorityRequestDTO,
  DeletePendingMessageWithPriorityResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.deletePendingMessageWithPriority(ctx.state.dto);
  };
};
