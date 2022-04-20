import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { PurgeScheduledMessagesRequestDTO } from './purge-scheduled-messages.request.DTO';
import { PurgeScheduledMessagesResponseDTO } from './purge-scheduled-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../services';

export const PurgeScheduledMessagesHandler: TRouteControllerActionHandler<
  PurgeScheduledMessagesRequestDTO,
  PurgeScheduledMessagesResponseDTO
> = () => {
  return async () => {
    return messagesServiceInstance().purgeScheduledMessages();
  };
};
