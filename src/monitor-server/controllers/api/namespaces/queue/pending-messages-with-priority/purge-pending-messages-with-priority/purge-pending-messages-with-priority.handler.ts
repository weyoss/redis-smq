import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgePendingMessagesWithPriorityRequestDTO } from './purge-pending-messages-with-priority.request.DTO';
import { PurgePendingMessagesWithPriorityResponseDTO } from './purge-pending-messages-with-priority.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const PurgePendingMessagesWithPriorityHandler: TRouteControllerActionHandler<
  PurgePendingMessagesWithPriorityRequestDTO,
  PurgePendingMessagesWithPriorityResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().purgePendingMessagesWithPriority(
      ctx.state.dto,
    );
  };
};
