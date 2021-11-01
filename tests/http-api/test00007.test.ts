import {
  getProducer,
  ISuperTestResponse,
  produceMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { Message } from '../../src/message';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/get-messages-response-body.DTO';

test('Fetching pending messages', async () => {
  await startMonitorServer();
  const { message } = await produceMessage();

  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.get(
      `/api/queues/${message.getQueue()}/pending-messages?skip=0&take=99`,
    );

  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].sequenceId).toBe(0);
  expect(response1.body.data?.items[0].message.uuid).toBe(message.getId());
});
