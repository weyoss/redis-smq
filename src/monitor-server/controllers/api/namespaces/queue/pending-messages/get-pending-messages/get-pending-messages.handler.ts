import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetPendingMessagesRequestDTO } from './get-pending-messages.request.DTO';
import { GetPendingMessagesResponseDTO } from './get-pending-messages.response.DTO';

export const GetPendingMessagesHandler: TRouteControllerActionHandler<
  GetPendingMessagesRequestDTO,
  GetPendingMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.getPendingMessages(ctx.state.dto);
  };
};
