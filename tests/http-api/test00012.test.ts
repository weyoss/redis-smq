import {
  ISuperTestResponse,
  produceAndAcknowledgeMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/get-messages-response-body.DTO';

test('Delete an acknowledged message', async () => {
  await startMonitorServer();
  const { message } = await produceAndAcknowledgeMessage();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.delete(
      `/api/queues/${message.getQueue()}/acknowledged-messages/${message.getId()}?sequenceId=0`,
    );
  expect(response1.statusCode).toBe(204);
  expect(response1.body).toEqual({});
});
