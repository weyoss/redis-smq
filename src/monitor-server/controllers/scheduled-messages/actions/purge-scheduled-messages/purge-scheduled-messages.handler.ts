import { TApplication } from '../../../../types/common';

export function PurgeScheduledMessagesHandler(app: TApplication) {
  return async () => {
    const { queuesService } = app.context.services;
    return queuesService.purgeScheduledMessagesQueue();
  };
}
