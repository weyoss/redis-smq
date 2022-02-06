import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgeDeadLetteredMessagesRequestDTO } from './purge-dead-lettered-messages.request.DTO';
import { PurgeDeadLetteredMessagesResponseDTO } from './purge-dead-lettered-messages.response.DTO';

export const PurgeDeadLetteredMessagesHandler: TRouteControllerActionHandler<
  PurgeDeadLetteredMessagesRequestDTO,
  PurgeDeadLetteredMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.purgeDeadLetteredMessages(ctx.state.dto);
  };
};
