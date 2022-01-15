import {
  ISuperTestResponse,
  produceMessageWithPriority,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/dto/queues/get-messages-response-body.DTO';

test('Deleting a pending messages with priority', async () => {
  await startMonitorServer();
  const { message } = await produceMessageWithPriority();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.delete(
      `/api/queues/${message.getQueue()?.name}/ns/${
        message.getQueue()?.ns
      }/pending-messages-with-priority/${message.getId()}`,
    );
  expect(response1.statusCode).toBe(204);
  expect(response1.body).toEqual({});
});
