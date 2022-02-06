import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgePendingMessagesWithPriorityRequestDTO } from './purge-pending-messages-with-priority.request.DTO';
import { PurgePendingMessagesWithPriorityResponseDTO } from './purge-pending-messages-with-priority.response.DTO';

export const PurgePendingMessagesWithPriorityHandler: TRouteControllerActionHandler<
  PurgePendingMessagesWithPriorityRequestDTO,
  PurgePendingMessagesWithPriorityResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.purgePendingMessagesWithPriority(ctx.state.dto);
  };
};
