import { TApplication } from '../../../../../../types/common';
import { TPurgeQueueContext } from '../../context';

export function PurgePendingMessagesWithPriorityHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { messagesService } = app.context.services;
    return messagesService.purgePendingMessagesWithPriority(ctx.state.dto);
  };
}
