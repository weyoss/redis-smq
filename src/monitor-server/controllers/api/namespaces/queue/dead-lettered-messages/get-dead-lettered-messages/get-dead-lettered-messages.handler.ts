import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetDeadLetteredMessagesRequestDTO } from './get-dead-lettered-messages.request.DTO';
import { GetDeadLetteredMessagesResponseDTO } from './get-dead-lettered-messages.response.DTO';

export const GetDeadLetteredMessagesHandler: TRouteControllerActionHandler<
  GetDeadLetteredMessagesRequestDTO,
  GetDeadLetteredMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.getDeadLetteredMessages(ctx.state.dto);
  };
};
