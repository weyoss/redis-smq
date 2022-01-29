import {
  ICallback,
  TWebsocketHeartbeatOnlineIdsStreamPayload,
  TWorkerParameters,
} from '../../../types';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import * as async from 'async';
import { ConsumerHeartbeat } from '../../system/consumer/consumer-heartbeat';
import { setConfiguration } from '../../system/common/configuration';
import { Worker } from '../../system/common/worker';

export class WebsocketHeartbeatStreamWorker extends Worker {
  protected noop = (): void => void 0;

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
          async.each(
            reply ?? [],
            (item, done) => {
              const payload = String(item.payload);
              onlineIds.consumers.push(item.consumerId);
              this.redisClient.publish(
                `streamConsumerHeartbeat:${item.consumerId}`,
                payload,
                this.noop,
              );
              done();
            },
            () => {
              this.redisClient.publish(
                `streamHeartbeatOnlineIds`,
                JSON.stringify(onlineIds),
                this.noop,
              );
              cb();
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
      new WebsocketHeartbeatStreamWorker(client, params).run();
    }
  });
});
