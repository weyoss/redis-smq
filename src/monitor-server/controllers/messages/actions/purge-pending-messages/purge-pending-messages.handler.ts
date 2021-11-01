import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../../../common/context';

export function PurgePendingMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queueManagerService } = app.context.services;
    return queueManagerService.purgePendingQueue(ctx.state.dto);
  };
}
