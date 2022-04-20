import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeleteAcknowledgedMessageRequestDTO } from './delete-acknowledged-message.request.DTO';
import { DeleteAcknowledgedMessageResponseDTO } from './delete-acknowledged-message.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const DeleteAcknowledgedMessageHandler: TRouteControllerActionHandler<
  DeleteAcknowledgedMessageRequestDTO,
  DeleteAcknowledgedMessageResponseDTO
> = () => {
  return async (ctx) => {
    return messagesServiceInstance().deleteAcknowledgedMessage(ctx.state.dto);
  };
};
