import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetPendingMessagesWithPriorityRequestDTO } from './get-pending-messages-with-priority.request.DTO';
import { GetPendingMessagesWithPriorityResponseDTO } from './get-pending-messages-with-priority.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const GetPendingMessagesWithPriorityHandler: TRouteControllerActionHandler<
  GetPendingMessagesWithPriorityRequestDTO,
  GetPendingMessagesWithPriorityResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().getPendingMessagesWithPriority(
      ctx.state.dto,
    );
  };
};
