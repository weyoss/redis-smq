import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgeDeadLetteredMessagesRequestDTO } from './purge-dead-lettered-messages.request.DTO';
import { PurgeDeadLetteredMessagesResponseDTO } from './purge-dead-lettered-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const PurgeDeadLetteredMessagesHandler: TRouteControllerActionHandler<
  PurgeDeadLetteredMessagesRequestDTO,
  PurgeDeadLetteredMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().purgeDeadLetteredMessages(ctx.state.dto);
  };
};
