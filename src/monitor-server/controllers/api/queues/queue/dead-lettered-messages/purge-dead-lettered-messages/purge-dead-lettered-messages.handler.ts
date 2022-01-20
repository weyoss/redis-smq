import { TApplication } from '../../../../../../types/common';
import { TPurgeQueueContext } from '../../context';

export function PurgeDeadLetteredMessagesHandler(app: TApplication) {
  return async (ctx: TPurgeQueueContext) => {
    const { messagesService } = app.context.services;
    return messagesService.purgeDeadLetteredMessages(ctx.state.dto);
  };
}
