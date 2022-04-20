import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages.request.DTO';
import { GetScheduledMessagesResponseDTO } from './get-scheduled-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../services';

export const GetScheduledMessagesHandler: TRouteControllerActionHandler<
  GetScheduledMessagesRequestDTO,
  GetScheduledMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().getScheduledMessages(ctx.state.dto);
  };
};
