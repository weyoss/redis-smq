import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../context';

export function PurgeDeadLetteredMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queuesService } = app.context.services;
    return queuesService.purgeDeadLetterQueue(ctx.state.dto);
  };
}
