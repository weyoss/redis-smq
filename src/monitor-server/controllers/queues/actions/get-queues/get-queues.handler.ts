import { TApplication } from '../../../../types/common';

export function GetQueuesHandler(app: TApplication) {
  return async () => {
    const { queueManagerService } = app.context.services;
    return queueManagerService.getQueues();
  };
}
