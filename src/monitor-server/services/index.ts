import { SchedulerService } from './scheduler.service';
import { TApplication } from '../types/common';

let schedulerServiceInstance: SchedulerService | null = null;

export function Services(app: TApplication) {
  const { redis } = app.context;
  return {
    SchedulerService() {
      if (!schedulerServiceInstance) {
        schedulerServiceInstance = new SchedulerService(redis);
      }
      return schedulerServiceInstance;
    },
  };
}
