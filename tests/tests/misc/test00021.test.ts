import { EQueueSettingType, EQueueType } from '../../../types';
import { Queue } from '../../../src/lib/queue-manager/queue';

test('Queue: test settings parsing compatibility with redis-smq@7.1', async () => {
  expect(
    Queue.parseSettings({
      [EQueueSettingType.PRIORITY_QUEUING]: 'true',
    }),
  ).toEqual({
    type: EQueueType.PRIORITY_QUEUE,
    exchange: null,
    priorityQueuing: true,
    rateLimit: null,
  });

  expect(
    Queue.parseSettings({
      [EQueueSettingType.PRIORITY_QUEUING]: 'false',
    }),
  ).toEqual({
    type: EQueueType.LIFO_QUEUE,
    exchange: null,
    priorityQueuing: false,
    rateLimit: null,
  });

  expect(
    Queue.parseSettings({
      [EQueueSettingType.QUEUE_TYPE]: JSON.stringify(EQueueType.LIFO_QUEUE),
    }),
  ).toEqual({
    type: EQueueType.LIFO_QUEUE,
    exchange: null,
    priorityQueuing: false,
    rateLimit: null,
  });

  expect(
    Queue.parseSettings({
      [EQueueSettingType.QUEUE_TYPE]: JSON.stringify(EQueueType.FIFO_QUEUE),
    }),
  ).toEqual({
    type: EQueueType.FIFO_QUEUE,
    exchange: null,
    priorityQueuing: false,
    rateLimit: null,
  });

  expect(
    Queue.parseSettings({
      [EQueueSettingType.QUEUE_TYPE]: JSON.stringify(EQueueType.PRIORITY_QUEUE),
    }),
  ).toEqual({
    type: EQueueType.PRIORITY_QUEUE,
    exchange: null,
    priorityQueuing: true,
    rateLimit: null,
  });
});
