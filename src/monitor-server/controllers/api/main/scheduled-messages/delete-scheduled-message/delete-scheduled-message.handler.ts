import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { DeleteScheduledMessageRequestDTO } from './delete-scheduled-message-request.DTO';
import { DeleteScheduledMessageResponseDTO } from './delete-scheduled-message-response.DTO';

export const DeleteScheduledMessageHandler: TRouteControllerActionHandler<
  DeleteScheduledMessageRequestDTO,
  DeleteScheduledMessageResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.deleteScheduledMessage(ctx.state.dto);
  };
};
