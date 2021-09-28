import { getProducer } from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';

describe('Produce and delete a scheduled message', () => {
  test('Case 1', async () => {
    const producer = getProducer();
    const scheduler = promisifyAll(await producer.getSchedulerAsync());

    // Message 1
    const msg1 = new Message();
    expect(scheduler.isSchedulable(msg1)).toBe(false);

    msg1.setScheduledDelay(30);
    expect(scheduler.isSchedulable(msg1)).toBe(true);
    expect(scheduler.isPeriodic(msg1)).toBe(false);

    msg1.setScheduledCron('0 * * * * *').setBody({ hello: 'world1' });
    expect(scheduler.isSchedulable(msg1)).toBe(true);
    expect(scheduler.isPeriodic(msg1)).toBe(true);

    await producer.produceMessageAsync(msg1);

    // Message 2
    const msg2 = new Message();
    msg2.setScheduledDelay(60).setBody({ hello: 'world2' });
    const r1 = await scheduler.scheduleAsync(msg2);
    expect(r1).toBe(true);

    // Message 3
    const msg3 = new Message();
    const r2 = await scheduler.scheduleAsync(msg3);
    expect(r2).toBe(false);

    msg3.setScheduledDelay(90).setBody({ hello: 'world3' });
    const r3 = await scheduler.scheduleAsync(msg3);
    expect(r3).toBe(true);

    // Page 1
    const pageOne = await scheduler.getScheduledMessagesAsync(0, 2);
    if (!pageOne) {
      throw new Error('Expected non empty reply');
    }
    expect(pageOne.total).toEqual(3);
    expect(pageOne.items.length).toEqual(2);
    expect(pageOne.items[0].getMessageScheduledDelay()).toEqual(30000);
    expect(pageOne.items[1].getMessageScheduledDelay()).toEqual(60000);

    // Page 2
    const pageTwo = await scheduler.getScheduledMessagesAsync(2, 2);
    if (!pageTwo) {
      throw new Error('Expected non empty reply');
    }
    expect(pageTwo.total).toEqual(3);
    expect(pageTwo.items.length).toEqual(1);
    expect(pageTwo.items[0].getMessageScheduledDelay()).toEqual(90000);

    // Delete a scheduled message
    const result = await scheduler.deleteScheduledMessageAsync(
      pageOne.items[1].getId(),
    );
    expect(result).toBe(true);

    // Page 1
    const singlePage = await scheduler.getScheduledMessagesAsync(0, 100);
    if (!singlePage) {
      throw new Error('Expected non empty reply');
    }
    expect(singlePage.total).toEqual(2);
    expect(singlePage.items.length).toEqual(2);
    expect(singlePage.items[0].getMessageScheduledDelay()).toEqual(30000);
    expect(singlePage.items[1].getMessageScheduledDelay()).toEqual(90000);
  });
});
