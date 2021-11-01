import {
  ISuperTestResponse,
  produceMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';

test('Fetching queues', async () => {
  await startMonitorServer();
  const { message } = await produceMessage();

  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<string[]> = await request.get(
    '/api/queues',
  );

  //console.log('LLLL', response1);

  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.length).toBe(1);
  expect((response1.body.data ?? [])[0]).toBe(message.getQueue());
});
