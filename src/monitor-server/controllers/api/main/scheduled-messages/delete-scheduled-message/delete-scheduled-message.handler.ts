import { TApplication } from '../../../../../types/common';
import { TDeleteScheduledMessageContext } from '../context';

export function DeleteScheduledMessageHandler(app: TApplication) {
  return async (ctx: TDeleteScheduledMessageContext) => {
    const { messagesService } = app.context.services;
    return messagesService.deleteScheduledMessage(ctx.state.dto);
  };
}
