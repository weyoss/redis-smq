import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../context';

export function DeleteDeadLetteredMessageHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messagesService } = app.context.services;
    return messagesService.deleteDeadLetteredMessage(ctx.state.dto);
  };
}
