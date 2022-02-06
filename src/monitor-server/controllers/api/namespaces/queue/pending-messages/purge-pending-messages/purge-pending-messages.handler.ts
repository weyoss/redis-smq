import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgePendingMessagesRequestDTO } from './purge-pending-messages.request.DTO';
import { PurgePendingMessagesResponseDTO } from './purge-pending-messages.response.DTO';

export const PurgePendingMessagesHandler: TRouteControllerActionHandler<
  PurgePendingMessagesRequestDTO,
  PurgePendingMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.purgePendingMessages(ctx.state.dto);
  };
};
