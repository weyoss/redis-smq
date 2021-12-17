import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../context';

export function DeletePendingMessageWithPriorityHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messagesService } = app.context.services;
    return messagesService.deletePendingMessageWithPriority(ctx.state.dto);
  };
}
