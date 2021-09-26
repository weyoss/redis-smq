import { SchedulerService } from './scheduler.service';
import { TApplication } from '../types/common';

export function Services(app: TApplication) {
  const { redis } = app.context;
  let schedulerServiceInstance: SchedulerService | null = null;
  return {
    SchedulerService() {
      if (!schedulerServiceInstance) {
        schedulerServiceInstance = new SchedulerService(redis);
      }
      return schedulerServiceInstance;
    },
  };
}
