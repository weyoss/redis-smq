import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { IQueueParams } from '../queue-manager/index.js';
import { MessageBrowserAbstract } from '../common/message-browser/message-browser-abstract.js';
import { BrowserStorageSet } from '../common/message-browser/browser-storage/browser-storage-set.js';
import { IQueueMessagesCount } from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { IBrowserStorage } from '../common/message-browser/browser-storage/browser-storage-abstract.js';
import { EQueueMessageType } from '../common/index.js';

/**
 * QueueMessages class manages message counting and state reporting across queue types.
 * It orchestrates various message handlers (pending, acknowledged, scheduled, dead-lettered)
 * and leverages a waterfall pattern for processing.
 */
export class QueueMessages extends MessageBrowserAbstract {
  protected readonly redisKey = 'keyQueueMessages';
  readonly messageType = EQueueMessageType.ALL_MESSAGES;

  protected createDefaultStorage(): IBrowserStorage {
    return new BrowserStorageSet(this.logger);
  }

  /**
   * Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.
   * @param queue - Queue string name or parameters.
   * @param cb - Callback function returning the IQueueMessagesCount.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   */
  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      return cb(queueParams);
    }
    withSharedPoolConnection((client, cb) => {
      _getQueueProperties(client, queueParams, (err, properties) => {
        if (err) {
          return cb(err);
        }
        if (!properties) {
          return cb(new CallbackEmptyReplyError());
        }
        return cb(null, {
          pending: properties.pendingMessagesCount,
          acknowledged: properties.acknowledgedMessagesCount,
          scheduled: properties.scheduledMessagesCount,
          deadLettered: properties.deadLetteredMessagesCount,
        });
      });
    }, cb);
  }
}
