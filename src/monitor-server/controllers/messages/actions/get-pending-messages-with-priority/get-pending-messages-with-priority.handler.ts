import { TApplication } from '../../../../types/common';
import { TGetMessagesContext } from '../../../common/context';

export function GetPendingMessagesWithPriorityHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.getPendingMessagesWithPriority(ctx.state.dto);
  };
}
