import { TApplication } from '../../../../../../types/common';
import { TGetMessagesContext } from '../../context';

export function GetPendingMessagesHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messagesService } = app.context.services;
    return messagesService.getPendingMessages(ctx.state.dto);
  };
}
