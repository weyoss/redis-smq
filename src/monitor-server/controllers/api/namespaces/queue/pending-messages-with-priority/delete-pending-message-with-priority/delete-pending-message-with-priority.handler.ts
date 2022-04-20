import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeletePendingMessageWithPriorityRequestDTO } from './delete-pending-message-with-priority.request.DTO';
import { DeletePendingMessageWithPriorityResponseDTO } from './delete-pending-message-with-priority.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const DeletePendingMessageWithPriorityHandler: TRouteControllerActionHandler<
  DeletePendingMessageWithPriorityRequestDTO,
  DeletePendingMessageWithPriorityResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().deletePendingMessageWithPriority(
      ctx.state.dto,
    );
  };
};
