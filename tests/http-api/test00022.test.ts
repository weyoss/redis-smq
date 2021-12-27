import {
  ISuperTestResponse,
  produceMessageWithPriority,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetPendingMessagesWithPriorityResponseBodyDataDTO } from '../../src/monitor-server/controllers/messages/actions/get-pending-messages-with-priority/get-pending-messages-with-priority-response.DTO';

test('Purge pending messages with priority', async () => {
  await startMonitorServer();
  const { producer, message } = await produceMessageWithPriority();
  const queue = producer.getQueue();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetPendingMessagesWithPriorityResponseBodyDataDTO> =
    await request.get(
      `/api/ns/${queue.ns}/queues/${queue.name}/pending-messages-with-priority?skip=0&take=99`,
    );
  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].uuid).toBe(message.getId());
  const response2: ISuperTestResponse<void> = await request.delete(
    `/api/ns/${queue.ns}/queues/${queue.name}/pending-messages-with-priority`,
  );
  expect(response2.statusCode).toBe(204);
  expect(response2.body).toEqual({});
  const response3: ISuperTestResponse<GetPendingMessagesWithPriorityResponseBodyDataDTO> =
    await request.get(
      `/api/ns/${queue.ns}/queues/${queue.name}/pending-messages-with-priority?skip=0&take=99`,
    );
  expect(response3.statusCode).toBe(200);
  expect(response3.body.data).toBeDefined();
  expect(response3.body.data?.total).toBe(0);
  expect(response3.body.data?.items.length).toBe(0);
});
