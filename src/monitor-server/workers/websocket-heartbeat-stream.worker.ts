import {
  ICallback,
  TWebsocketHeartbeatOnlineIdsStreamPayload,
  TWorkerParameters,
} from '../../../types';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { ConsumerHeartbeat } from '../../system/app/consumer/consumer-heartbeat';
import { setConfiguration } from '../../system/common/configuration';
import { Worker } from '../../system/common/worker/worker';
import { each } from '../../system/lib/async';

export class WebsocketHeartbeatStreamWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    const onlineIds: TWebsocketHeartbeatOnlineIdsStreamPayload = {
      consumers: [],
    };
    ConsumerHeartbeat.getValidHeartbeats(
      this.redisClient,
      false,
      (err, reply) => {
        if (err) cb(err);
        else {
          each(
            reply ?? [],
            (item, _, done) => {
              const payload = String(item.payload);
              onlineIds.consumers.push(item.consumerId);
              this.redisClient.publish(
                `streamConsumerHeartbeat:${item.consumerId}`,
                payload,
                () => done(),
              );
            },
            () => {
              this.redisClient.publish(
                `streamHeartbeatOnlineIds`,
                JSON.stringify(onlineIds),
                () => cb(),
              );
            },
          );
        }
      },
    );
  };
}

export default WebsocketHeartbeatStreamWorker;

process.on('message', (payload: string) => {
  const params: TWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      new WebsocketHeartbeatStreamWorker(client, params, false).run();
    }
  });
});
