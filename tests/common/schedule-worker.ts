import ScheduleWorker from '../../src/workers/schedule.worker';
import { getRedisInstance } from './redis';
import { promisifyAll } from 'bluebird';

let scheduleWorker: ScheduleWorker | null = null;

export async function startScheduleWorker(): Promise<void> {
  if (!scheduleWorker) {
    const redisClient = await getRedisInstance();
    scheduleWorker = new ScheduleWorker(redisClient, false);
    scheduleWorker.run();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  if (scheduleWorker) {
    await promisifyAll(scheduleWorker).quitAsync();
    scheduleWorker = null;
  }
}
