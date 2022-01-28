import {
  ISuperTestResponse,
  produceAndAcknowledgeMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/dto/queues/get-messages-response-body.DTO';

test('Fetching acknowledged messages', async () => {
  await startMonitorServer();
  const { message, queue } = await produceAndAcknowledgeMessage();

  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.get(
      `/api/queues/${queue.name}/ns/${queue.ns}/acknowledged-messages?skip=0&take=99`,
    );

  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(1);
  expect(response1.body.data?.items.length).toBe(1);
  expect(response1.body.data?.items[0].sequenceId).toBe(0);
  expect(response1.body.data?.items[0].message.metadata.uuid).toBe(
    message.getRequiredId(),
  );
});
