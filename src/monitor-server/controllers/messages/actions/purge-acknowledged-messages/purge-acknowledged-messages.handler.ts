import { TApplication } from '../../../../types/common';
import { TPurgeQueueContext } from '../../../common/context';

export function PurgeAcknowledgedMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { queueManagerService } = app.context.services;
    return queueManagerService.purgeAcknowledgedQueue(ctx.state.dto);
  };
}
