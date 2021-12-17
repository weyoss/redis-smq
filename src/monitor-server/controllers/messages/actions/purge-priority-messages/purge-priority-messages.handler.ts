import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../context';

export function PurgePriorityMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queuesService } = app.context.services;
    return queuesService.purgePriorityQueue(ctx.state.dto);
  };
}
