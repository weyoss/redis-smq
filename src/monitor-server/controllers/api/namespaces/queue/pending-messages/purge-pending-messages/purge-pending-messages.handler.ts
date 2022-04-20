import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgePendingMessagesRequestDTO } from './purge-pending-messages.request.DTO';
import { PurgePendingMessagesResponseDTO } from './purge-pending-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const PurgePendingMessagesHandler: TRouteControllerActionHandler<
  PurgePendingMessagesRequestDTO,
  PurgePendingMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().purgePendingMessages(ctx.state.dto);
  };
};
