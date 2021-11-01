import { ISuperTestResponse, startMonitorServer } from '../common';
import * as supertest from 'supertest';
import { GetMessagesResponseBodyDataDTO } from '../../src/monitor-server/controllers/common/get-messages-response-body.DTO';

test('Fetching and deleting scheduled messages using the HTTP API: Case 3', async () => {
  await startMonitorServer();
  const request = supertest('http://127.0.0.1:3000');
  const response1: ISuperTestResponse<GetMessagesResponseBodyDataDTO> =
    await request.get('/api/scheduled-messages?skip=a');
  expect(response1.statusCode).toBe(422);
  expect(response1.body.data).toBeUndefined();
  expect(response1.body.error).toBeDefined();
  expect(response1.body.error?.code).toBe(422);
  expect(Object.keys(response1.body.error ?? {})).toEqual(
    expect.arrayContaining(['code', 'message', 'details']),
  );
  expect(Object.keys(response1.body.error?.details ?? {})).toEqual(
    expect.arrayContaining(['target', 'property', 'children', 'constraints']),
  );
});
