import { TApplication } from '../../../../../../types/common';
import { TGetMessagesContext } from '../../context';

export function GetPendingMessagesWithPriorityHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messagesService } = app.context.services;
    return messagesService.getPendingMessagesWithPriority(ctx.state.dto);
  };
}
