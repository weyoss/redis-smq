import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetAcknowledgedMessagesRequestDTO } from './get-acknowledged-messages.request.DTO';
import { GetAcknowledgedMessagesResponseDTO } from './get-acknowledged-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const GetAcknowledgedMessagesHandler: TRouteControllerActionHandler<
  GetAcknowledgedMessagesRequestDTO,
  GetAcknowledgedMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().getAcknowledgedMessages(ctx.state.dto);
  };
};
