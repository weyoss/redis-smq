import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeleteDeadLetteredMessageRequestDTO } from './delete-dead-lettered-message.request.DTO';
import { DeleteDeadLetteredMessageResponseDTO } from './delete-dead-lettered-message.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const DeleteDeadLetteredMessageHandler: TRouteControllerActionHandler<
  DeleteDeadLetteredMessageRequestDTO,
  DeleteDeadLetteredMessageResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().deleteDeadLetteredMessage(ctx.state.dto);
  };
};
