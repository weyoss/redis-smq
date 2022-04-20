import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { RequeueDeadLetteredMessageRequestDTO } from './requeue-dead-lettered-message.request.DTO';
import { RequeueDeadLetteredMessageResponseDTO } from './requeue-dead-lettered-message.response.DTO';
import { messagesServiceInstance } from '../../../../../../services';

export const RequeueDeadLetteredMessageHandler: TRouteControllerActionHandler<
  RequeueDeadLetteredMessageRequestDTO,
  RequeueDeadLetteredMessageResponseDTO
> = () => {
  return async (ctx) => {
    await messagesServiceInstance().requeueDeadLetteredMessage(ctx.state.dto);
  };
};
