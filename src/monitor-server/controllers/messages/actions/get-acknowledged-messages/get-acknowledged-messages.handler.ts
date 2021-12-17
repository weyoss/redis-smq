import { TApplication } from '../../../../types/common';
import { TGetMessagesContext } from '../context';

export function GetAcknowledgedMessagesHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messagesService } = app.context.services;
    return messagesService.getAcknowledgedMessages(ctx.state.dto);
  };
}
