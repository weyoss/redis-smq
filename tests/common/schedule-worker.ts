import ScheduleWorker from '../../src/workers/schedule.worker';
import { getRedisInstance } from './redis';

let scheduleWorker: ScheduleWorker | null = null;

export async function startScheduleWorker(): Promise<void> {
  if (!scheduleWorker) {
    const redisClient = await getRedisInstance();
    scheduleWorker = new ScheduleWorker(redisClient, false);
    scheduleWorker.run();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (scheduleWorker) {
      scheduleWorker.quit(() => {
        scheduleWorker = null;
        resolve();
      });
    } else resolve();
  });
}
