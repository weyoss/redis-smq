import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { DeleteScheduledMessageRequestDTO } from './delete-scheduled-message-request.DTO';
import { DeleteScheduledMessageResponseDTO } from './delete-scheduled-message-response.DTO';
import { messagesServiceInstance } from '../../../../../services';

export const DeleteScheduledMessageHandler: TRouteControllerActionHandler<
  DeleteScheduledMessageRequestDTO,
  DeleteScheduledMessageResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().deleteScheduledMessage(ctx.state.dto);
  };
};
