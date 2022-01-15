import { TApplication } from '../../../../types/common';

export function GetQueuesHandler(app: TApplication) {
  return async () => {
    const { queuesService } = app.context.services;
    return queuesService.getQueues();
  };
}
