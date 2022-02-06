import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { RequeueDeadLetteredMessageRequestDTO } from './requeue-dead-lettered-message.request.DTO';
import { RequeueDeadLetteredMessageResponseDTO } from './requeue-dead-lettered-message.response.DTO';

export const RequeueDeadLetteredMessageHandler: TRouteControllerActionHandler<
  RequeueDeadLetteredMessageRequestDTO,
  RequeueDeadLetteredMessageResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    await messagesService.requeueDeadLetteredMessage(ctx.state.dto);
  };
};
