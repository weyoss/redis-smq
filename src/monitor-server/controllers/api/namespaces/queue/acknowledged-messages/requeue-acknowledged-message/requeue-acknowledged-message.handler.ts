import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { RequeueAcknowledgedMessageRequestDTO } from './requeue-acknowledged-message.request.DTO';
import { RequeueAcknowledgedMessageResponseDTO } from './requeue-acknowledged-message.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const RequeueAcknowledgedMessageHandler: TRouteControllerActionHandler<
  RequeueAcknowledgedMessageRequestDTO,
  RequeueAcknowledgedMessageResponseDTO
> = () => {
  return async (ctx) => {
    await messagesServiceInstance().requeueAcknowledgedMessage(ctx.state.dto);
  };
};
