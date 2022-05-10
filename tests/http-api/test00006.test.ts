import {
  createQueue,
  defaultQueue,
  ISuperTestResponse,
  produceMessage,
  startMonitorServer,
} from '../common';
import * as supertest from 'supertest';
import { TQueueParams } from '../../types';

test('Fetching queues, namespaces, queue namespaces, deleting namespace', async () => {
  await startMonitorServer();
  await createQueue(defaultQueue, false);
  const { message } = await produceMessage();
  const request = supertest('http://127.0.0.1:3000');

  const r1: ISuperTestResponse<TQueueParams[]> = await request.get(
    '/api/queues',
  );
  expect(r1.statusCode).toBe(200);
  expect(r1.body.data).toBeDefined();
  expect(r1.body.data?.length).toBe(1);
  expect((r1.body.data ?? [])[0]).toEqual(message.getRequiredQueue());

  const r2: ISuperTestResponse<string[]> = await request.get('/api/ns');
  expect(r2.statusCode).toBe(200);
  expect(r2.body.data).toBeDefined();
  expect(r2.body.data?.length).toBe(1);
  expect((r2.body.data ?? [])[0]).toEqual(message.getRequiredQueue().ns);

  const r3: ISuperTestResponse<TQueueParams[]> = await request.get(
    `/api/ns/${message.getRequiredQueue().ns}/queues`,
  );
  expect(r3.statusCode).toBe(200);
  expect(r3.body.data).toBeDefined();
  expect(r3.body.data?.length).toBe(1);
  expect((r3.body.data ?? [])[0]).toEqual(message.getRequiredQueue());

  const r4: ISuperTestResponse<void> = await request.delete(
    `/api/ns/${message.getRequiredQueue().ns}`,
  );
  expect(r4.status).toEqual(204);
  expect(r4.body.data).toBeUndefined();

  const r5: ISuperTestResponse<TQueueParams[]> = await request.get(
    '/api/queues',
  );
  expect(r5.statusCode).toBe(200);
  expect(r5.body.data?.length).toBe(0);

  const r6: ISuperTestResponse<string[]> = await request.get('/api/ns');
  expect(r6.statusCode).toBe(200);
  expect(r6.body.data?.length).toBe(0);

  const r7: ISuperTestResponse<TQueueParams[]> = await request.get(
    `/api/ns/${message.getRequiredQueue().ns}/queues`,
  );
  expect(r7.statusCode).toBe(200);
  expect(r7.body.data?.length).toBe(0);
});
