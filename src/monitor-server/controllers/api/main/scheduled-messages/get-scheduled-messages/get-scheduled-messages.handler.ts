import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages.request.DTO';
import { GetScheduledMessagesResponseDTO } from './get-scheduled-messages.response.DTO';

export const GetScheduledMessagesHandler: TRouteControllerActionHandler<
  GetScheduledMessagesRequestDTO,
  GetScheduledMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.getScheduledMessages(ctx.state.dto);
  };
};
