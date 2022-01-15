import { TApplication } from '../../../../../../types/common';
import { TPurgeQueueContext } from '../../context';

export function PurgeAcknowledgedMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queuesService } = app.context.services;
    return queuesService.purgeAcknowledgedQueue(ctx.state.dto);
  };
}
