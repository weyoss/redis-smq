import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../context';

export function DeletePendingMessageHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messagesService } = app.context.services;
    return messagesService.deletePendingMessage(ctx.state.dto);
  };
}
