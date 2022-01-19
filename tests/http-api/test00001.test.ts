import {
  defaultQueue,
  getProducer,
  ISuperTestResponse,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { Message } from '../../src/message';
import { GetScheduledMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/api/main/scheduled-messages/get-scheduled-messages/get-scheduled-messages.response.DTO';

test('Fetching and deleting scheduled messages using the HTTP API: Case 1', async () => {
  await startMonitorServer();
  const producer = getProducer();

  const msg1 = new Message();
  msg1
    .setScheduledCron('0 * * * * *')
    .setBody({ hello: 'world1' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg1);

  const request = supertest('http://127.0.0.1:3000');

  //
  const response1: ISuperTestResponse<GetScheduledMessagesResponseBodyDataDTO> =
    await request.get('/api/main/scheduled-messages?skip=0&take=100');
  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].uuid).toBe(msg1.getId());

  //
  const response2: ISuperTestResponse<void> = await request.delete(
    `/api/main/scheduled-messages/${msg1.getId()}`,
  );
  expect(response2.statusCode).toBe(204);
  expect(response2.body).toEqual({});

  //
  const response3: ISuperTestResponse<GetScheduledMessagesResponseBodyDataDTO> =
    await request.get('/api/main/scheduled-messages?skip=0&take=100');
  expect(response3.statusCode).toBe(200);
  expect(response3.body.data).toBeDefined();
  expect(response3.body.data?.total).toBe(0);
  expect(response3.body.data?.items.length).toBe(0);
});
