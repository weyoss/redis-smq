import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetAcknowledgedMessagesRequestDTO } from './get-acknowledged-messages.request.DTO';
import { GetAcknowledgedMessagesResponseDTO } from './get-acknowledged-messages.response.DTO';

export const GetAcknowledgedMessagesHandler: TRouteControllerActionHandler<
  GetAcknowledgedMessagesRequestDTO,
  GetAcknowledgedMessagesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    return messagesService.getAcknowledgedMessages(ctx.state.dto);
  };
};
