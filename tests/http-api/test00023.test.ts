import {
  ISuperTestResponse,
  scheduleMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetScheduledMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/api/main/scheduled-messages/get-scheduled-messages/get-scheduled-messages.response.DTO';

test('Purge scheduled messages', async () => {
  await startMonitorServer();
  const { message } = await scheduleMessage();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetScheduledMessagesResponseBodyDataDTO> =
    await request.get(`/api/main/scheduled-messages?skip=0&take=99`);
  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].metadata?.uuid).toBe(
    message.getRequiredId(),
  );
  const response2: ISuperTestResponse<void> = await request.delete(
    `/api/main/scheduled-messages`,
  );
  expect(response2.statusCode).toBe(204);
  expect(response2.body).toEqual({});
  const response3: ISuperTestResponse<GetScheduledMessagesResponseBodyDataDTO> =
    await request.get(`/api/main/scheduled-messages?skip=0&take=99`);
  expect(response3.statusCode).toBe(200);
  expect(response3.body.data).toBeDefined();
  expect(response3.body.data?.total).toBe(0);
  expect(response3.body.data?.items.length).toBe(0);
});
