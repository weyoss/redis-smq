import {
  ISuperTestResponse,
  produceAndDeadLetterMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/dto/queues/get-messages-response-body.DTO';

test('Purge dead-lettered messages', async () => {
  await startMonitorServer();
  const { message, queue } = await produceAndDeadLetterMessage();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.get(
      `/api/queues/${queue.name}/ns/${queue.ns}/dead-lettered-messages?skip=0&take=99`,
    );
  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].sequenceId).toBe(0);
  expect(response1.body.data?.items[0].message.uuid).toBe(message.getId());
  const response2: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.delete(
      `/api/queues/${queue.name}/ns/${queue.ns}/dead-lettered-messages`,
    );
  expect(response2.statusCode).toBe(204);
  expect(response2.body).toEqual({});
  const response3: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.get(
      `/api/queues/${queue.name}/ns/${queue.ns}/dead-lettered-messages?skip=0&take=99`,
    );
  expect(response3.statusCode).toBe(200);
  expect(response3.body.data).toBeDefined();
  expect(response3.body.data?.total).toBe(0);
  expect(response3.body.data?.items.length).toBe(0);
});
