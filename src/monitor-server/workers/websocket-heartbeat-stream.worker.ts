import {
  ICallback,
  TWebsocketHeartbeatOnlineIdsStreamPayload,
} from '../../../types';
import { ConsumerHeartbeat } from '../../system/app/consumer/consumer-heartbeat';
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
