import { TApplication } from '../../../../types/common';
import { TGetMessagesContext } from '../../../common/context';

export function GetPendingMessagesHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.getPendingMessages(ctx.state.dto);
  };
}
