import { TApplication } from '../../../../../types/common';
import { TGetScheduledMessagesContext } from '../context';

export function GetScheduledMessagesHandler(app: TApplication) {
  return async (ctx: TGetScheduledMessagesContext) => {
    const { messagesService } = app.context.services;
    return messagesService.getScheduledMessages(ctx.state.dto);
  };
}
