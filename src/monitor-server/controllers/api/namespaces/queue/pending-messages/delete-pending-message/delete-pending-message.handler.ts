import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeletePendingMessageRequestDTO } from './delete-pending-message.request.DTO';
import { DeletePendingMessageResponseDTO } from './delete-pending-message.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const DeletePendingMessageHandler: TRouteControllerActionHandler<
  DeletePendingMessageRequestDTO,
  DeletePendingMessageResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().deletePendingMessage(ctx.state.dto);
  };
};
