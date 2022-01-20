import { TApplication } from '../../../../../types/common';

export function PurgeScheduledMessagesHandler(app: TApplication) {
  return async () => {
    const { messagesService } = app.context.services;
    return messagesService.purgeScheduledMessages();
  };
}
