import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetPendingMessagesRequestDTO } from './get-pending-messages.request.DTO';
import { GetPendingMessagesResponseDTO } from './get-pending-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const GetPendingMessagesHandler: TRouteControllerActionHandler<
  GetPendingMessagesRequestDTO,
  GetPendingMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().getPendingMessages(ctx.state.dto);
  };
};
