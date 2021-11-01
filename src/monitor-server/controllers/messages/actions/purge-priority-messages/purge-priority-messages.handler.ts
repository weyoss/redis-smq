import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../../../common/context';

export function PurgePriorityMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queueManagerService } = app.context.services;
    return queueManagerService.purgePriorityQueue(ctx.state.dto);
  };
}
