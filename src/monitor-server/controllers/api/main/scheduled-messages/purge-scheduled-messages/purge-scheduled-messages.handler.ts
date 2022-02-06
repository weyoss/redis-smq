import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { PurgeScheduledMessagesRequestDTO } from './purge-scheduled-messages.request.DTO';
import { PurgeScheduledMessagesResponseDTO } from './purge-scheduled-messages.response.DTO';

export const PurgeScheduledMessagesHandler: TRouteControllerActionHandler<
  PurgeScheduledMessagesRequestDTO,
  PurgeScheduledMessagesResponseDTO
> = (app) => {
  return async () => {
    const { messagesService } = app.context.services;
    return messagesService.purgeScheduledMessages();
  };
};
