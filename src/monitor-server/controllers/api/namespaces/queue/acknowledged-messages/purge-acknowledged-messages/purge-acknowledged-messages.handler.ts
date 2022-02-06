import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgeAcknowledgedMessagesRequestDTO } from './purge-acknowledged-messages.request.DTO';
import { PurgeAcknowledgedMessagesResponseDTO } from './purge-acknowledged-messages.response.DTO';

export const PurgeAcknowledgedMessagesHandler: TRouteControllerActionHandler<
  PurgeAcknowledgedMessagesRequestDTO,
  PurgeAcknowledgedMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.purgeAcknowledgedMessages(ctx.state.dto);
  };
};
