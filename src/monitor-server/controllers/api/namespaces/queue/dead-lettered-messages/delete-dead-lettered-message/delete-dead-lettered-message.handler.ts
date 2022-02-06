import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { DeleteDeadLetteredMessageRequestDTO } from './delete-dead-lettered-message.request.DTO';
import { DeleteDeadLetteredMessageResponseDTO } from './delete-dead-lettered-message.response.DTO';

export const DeleteDeadLetteredMessageHandler: TRouteControllerActionHandler<
  DeleteDeadLetteredMessageRequestDTO,
  DeleteDeadLetteredMessageResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.deleteDeadLetteredMessage(ctx.state.dto);
  };
};
