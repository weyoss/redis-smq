import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeleteAcknowledgedMessageRequestDTO } from './delete-acknowledged-message.request.DTO';
import { DeleteAcknowledgedMessageResponseDTO } from './delete-acknowledged-message.response.DTO';

export const DeleteAcknowledgedMessageHandler: TRouteControllerActionHandler<
  DeleteAcknowledgedMessageRequestDTO,
  DeleteAcknowledgedMessageResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.deleteAcknowledgedMessage(ctx.state.dto);
  };
};
