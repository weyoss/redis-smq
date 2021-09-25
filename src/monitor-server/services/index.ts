import { SchedulerService } from './scheduler.service';
import { TApplication } from '../types/common';

export function Services(app: TApplication) {
  const { redis } = app.context;
  return {
    SchedulerService() {
      return new SchedulerService(redis);
    },
  };
}
