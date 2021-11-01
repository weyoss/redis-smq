import { TApplication } from '../../../types/common';

export function PurgeScheduledMessagesHandler(app: TApplication) {
  return async () => {
    const { queueManagerService } = app.context.services;
    return queueManagerService.purgeScheduledMessagesQueue();
  };
}
