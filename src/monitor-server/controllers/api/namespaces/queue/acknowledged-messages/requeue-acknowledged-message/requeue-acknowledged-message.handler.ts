import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { RequeueAcknowledgedMessageRequestDTO } from './requeue-acknowledged-message.request.DTO';
import { RequeueAcknowledgedMessageResponseDTO } from './requeue-acknowledged-message.response.DTO';

export const RequeueAcknowledgedMessageHandler: TRouteControllerActionHandler<
  RequeueAcknowledgedMessageRequestDTO,
  RequeueAcknowledgedMessageResponseDTO
> = (app) => {
  return async (ctx) => {
    const { messagesService } = app.context.services;
    await messagesService.requeueAcknowledgedMessage(ctx.state.dto);
  };
};
