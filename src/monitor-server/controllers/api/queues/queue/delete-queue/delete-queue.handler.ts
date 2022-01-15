import { TApplication, TRequestContext } from '../../../../../types/common';
import { DeleteMessageRequestDTO } from '../../../../common/dto/queues/delete-message-request.DTO';

export type TDeleteQueueContext = TRequestContext<DeleteMessageRequestDTO>;

export function DeleteQueueHandler(app: TApplication) {
  return async (ctx: TDeleteQueueContext) => {
    const { queuesService } = app.context.services;
    return queuesService.deleteQueue(ctx.state.dto);
  };
}
