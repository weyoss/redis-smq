import { getRedisInstance, startStatsWorker } from '../common';
import { TWebsocketMainStreamPayload } from '../../types';

test('WsMainStreamWorker: Case 1', async () => {
  await startStatsWorker();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe('mainStream');

  const json = await new Promise<TWebsocketMainStreamPayload>(
    (resolve, reject) => {
      subscribeClient.on('message', (channel, message) => {
        if (typeof message === 'string') {
          const json: TWebsocketMainStreamPayload = JSON.parse(message);
          resolve(json);
        } else reject(new Error('Expected a message payload'));
      });
    },
  );

  expect(Object.keys(json)).toEqual(
    expect.arrayContaining(['queues', 'scheduledMessages']),
  );
  expect(typeof json.scheduledMessages).toBe('number');
  expect(typeof json.queues).toEqual('object');
});
