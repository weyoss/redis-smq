import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../context';

export function DeleteAcknowledgedMessageHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messagesService } = app.context.services;
    return messagesService.deleteAcknowledgedMessage(ctx.state.dto);
  };
}
