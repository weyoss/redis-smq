import {
  ISuperTestResponse,
  produceAndDeadLetterMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/messages/common/get-messages-response-body.DTO';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

test('Requeuing a dead-lettered messages', async () => {
  await startMonitorServer();
  const { producer, message } = await produceAndDeadLetterMessage();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.post(
      `/api/ns/${redisKeys.getNamespace()}/queues/${producer.getQueueName()}/dead-lettered-messages/${message.getId()}/requeue?sequenceId=0`,
    );
  expect(response1.statusCode).toBe(204);
  expect(response1.body).toEqual({});
});
