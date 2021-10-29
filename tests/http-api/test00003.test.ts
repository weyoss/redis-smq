import { startMonitorServer } from '../common';
import * as supertest from 'supertest';

interface IResponse extends supertest.Response {
  body: {
    data?: {
      items: { uuid: string }[];
      total: number;
    };
    error?: {
      code: string;
      message: string;
      details: Record<string, any>;
    };
  };
}

test('Messages HTTP API: Case 3', async () => {
  await startMonitorServer();
  const request = supertest('http://127.0.0.1:3000');
  const response1: IResponse = await request.get('/api/messages?skip=a');
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
