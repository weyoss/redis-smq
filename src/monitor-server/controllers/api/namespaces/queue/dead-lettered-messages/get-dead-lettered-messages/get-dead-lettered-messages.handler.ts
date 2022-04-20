import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetDeadLetteredMessagesRequestDTO } from './get-dead-lettered-messages.request.DTO';
import { GetDeadLetteredMessagesResponseDTO } from './get-dead-lettered-messages.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const GetDeadLetteredMessagesHandler: TRouteControllerActionHandler<
  GetDeadLetteredMessagesRequestDTO,
  GetDeadLetteredMessagesResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().getDeadLetteredMessages(ctx.state.dto);
  };
};
