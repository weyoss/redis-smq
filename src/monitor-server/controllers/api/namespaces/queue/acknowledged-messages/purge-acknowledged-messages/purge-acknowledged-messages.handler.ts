import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { PurgeAcknowledgedMessagesRequestDTO } from './purge-acknowledged-messages.request.DTO';
import { PurgeAcknowledgedMessagesResponseDTO } from './purge-acknowledged-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const PurgeAcknowledgedMessagesHandler: TRouteControllerActionHandler<
  PurgeAcknowledgedMessagesRequestDTO,
  PurgeAcknowledgedMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().purgeAcknowledgedMessages(ctx.state.dto);
  };
};
