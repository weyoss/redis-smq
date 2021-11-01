import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../../../common/context';

export function PurgeDeadLetteredMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queueManagerService } = app.context.services;
    return queueManagerService.purgeDeadLetterQueue(ctx.state.dto);
  };
}
