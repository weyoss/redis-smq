import { TApplication, TRequestContext } from '../../../../types/common';
import { DeleteScheduledMessageRequestDTO } from './delete-scheduled-message-request.DTO';

type TDeleteScheduledMessageContext =
  TRequestContext<DeleteScheduledMessageRequestDTO>;

export function DeleteScheduledMessageHandler(app: TApplication) {
  return async (ctx: TDeleteScheduledMessageContext) => {
    const { SchedulerService } = app.context.services;
    return SchedulerService().deleteScheduledMessage(ctx.state.dto);
  };
}
