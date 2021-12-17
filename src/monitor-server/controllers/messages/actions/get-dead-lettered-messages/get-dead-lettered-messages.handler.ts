import { TApplication } from '../../../../types/common';
import { TGetMessagesContext } from '../context';

export function GetDeadLetteredMessagesHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messagesService } = app.context.services;
    return messagesService.getDeadLetteredMessages(ctx.state.dto);
  };
}
