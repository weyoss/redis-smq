import { getProducer, startMonitorServer } from './common';
import * as supertest from 'supertest';
import { Message } from '../src/message';

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

test('Messages HTTP API: Case 2', async () => {
  await startMonitorServer();
  const producer = getProducer();

  const messages: Message[] = [];
  for (let i = 0; i < 4; i += 1) {
    const msg = new Message();
    msg
      .setScheduledDelay(60000 * (i + 1))
      .setBody({ hello: `world ${msg.getId()}` });
    await producer.produceMessageAsync(msg);
    messages.push(msg);
  }

  const request = supertest('http://127.0.0.1:3000');
  const response1: IResponse = await request.get(
    '/api/scheduler/messages?queueName=test_queue&skip=0&take=2',
  );
  expect(response1.statusCode).toBe(200);
  expect(response1.body.data).toBeDefined();
  expect(response1.body.data?.total).toBe(4);
  expect(response1.body.data?.items.length).toBe(2);
  expect(response1.body.data?.items[0].uuid).toBe(messages[0].getId());
  expect(response1.body.data?.items[1].uuid).toBe(messages[1].getId());

  const response2: IResponse = await request.get(
    '/api/scheduler/messages?queueName=test_queue&skip=2&take=2',
  );
  expect(response2.statusCode).toBe(200);
  expect(response2.body.data).toBeDefined();
  expect(response2.body.data?.total).toBe(4);
  expect(response2.body.data?.items.length).toBe(2);
  expect(response2.body.data?.items[0].uuid).toBe(messages[2].getId());
  expect(response2.body.data?.items[1].uuid).toBe(messages[3].getId());

  const response3: IResponse = await request.get(
    '/api/scheduler/messages?queueName=test_queue&skip=4&take=2',
  );
  expect(response3.statusCode).toBe(200);
  expect(response3.body.data).toBeDefined();
  expect(response3.body.data?.total).toBe(4);
  expect(response3.body.data?.items.length).toBe(0);
});
