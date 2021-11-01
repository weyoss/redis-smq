import { TApplication } from '../../../types/common';
import { TGetScheduledMessagesContext } from '../../common/context';

export function GetScheduledMessagesHandler(app: TApplication) {
  return async (ctx: TGetScheduledMessagesContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.getScheduledMessages(ctx.state.dto);
  };
}
