import { TApplication } from '../../../../../../types/common';
import { TPurgeQueueContext } from '../../context';

export function PurgePendingMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { messagesService } = app.context.services;
    return messagesService.purgePendingMessages(ctx.state.dto);
  };
}
