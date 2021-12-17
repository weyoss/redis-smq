import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../context';

export function PurgePendingMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queuesService } = app.context.services;
    return queuesService.purgePendingQueue(ctx.state.dto);
  };
}
