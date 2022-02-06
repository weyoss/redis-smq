import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeletePendingMessageRequestDTO } from './delete-pending-message.request.DTO';
import { DeletePendingMessageResponseDTO } from './delete-pending-message.response.DTO';

export const DeletePendingMessageHandler: TRouteControllerActionHandler<
  DeletePendingMessageRequestDTO,
  DeletePendingMessageResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.deletePendingMessage(ctx.state.dto);
  };
};
