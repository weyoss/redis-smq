import {
  ISuperTestResponse,
  produceAndAcknowledgeMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/dto/queues/get-messages-response-body.DTO';

test('Re-queuing an acknowledged message', async () => {
  await startMonitorServer();
  const { message, queue } = await produceAndAcknowledgeMessage();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.post(
      `/api/queues/${queue.name}/ns/${
        queue.ns
      }/acknowledged-messages/${message.getId()}/requeue?sequenceId=0`,
    );
  expect(response1.statusCode).toBe(204);
  expect(response1.body).toEqual({});
});
