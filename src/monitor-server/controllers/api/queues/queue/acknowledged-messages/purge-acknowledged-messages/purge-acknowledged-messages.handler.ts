import { TApplication } from '../../../../../../types/common';
import { TPurgeQueueContext } from '../../context';

export function PurgeAcknowledgedMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { messagesService } = app.context.services;
    return messagesService.purgeAcknowledgedMessages(ctx.state.dto);
  };
}
