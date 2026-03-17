import { CallbackEmptyReplyError, ICallback, ILogger } from 'redis-smq-common';
import { EQueueType, IQueueParams } from '../queue-manager/index.js';
import { IMessageBrowser } from './message-browser/types/index.js';
import { MessageBrowser } from './message-browser/message-browser.js';
import { MessageManager } from '../message-manager/index.js';
import { BrowserStorageSortedSet } from './message-browser/browser-storage/browser-storage-sorted-set.js';
import { BrowserStorageList } from './message-browser/browser-storage/browser-storage-list.js';
import { EQueueMessageType } from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';

export class MessageBrowserFactory {
  private static createPendingMessagesBrowser(
    queueType: EQueueType,
    messageType: EQueueMessageType,
    logger: ILogger,
  ): IMessageBrowser {
    const messageManager = new MessageManager();
    switch (queueType) {
      case EQueueType.PRIORITY_QUEUE:
        return new MessageBrowser(
          messageManager,
          new BrowserStorageSortedSet(logger),
          messageType,
          'keyQueuePriorityPending',
          true,
          logger,
        );
      case EQueueType.LIFO_QUEUE:
      case EQueueType.FIFO_QUEUE:
        return new MessageBrowser(
          messageManager,
          new BrowserStorageList(logger),
          messageType,
          'keyQueuePending',
          true,
          logger,
        );
      default:
        throw new Error(`Unsupported queue type: ${queueType}`);
    }
  }

  public static createBrowserForQueueType(
    messageType: EQueueMessageType,
    queueType: EQueueType,
    logger: ILogger,
  ): IMessageBrowser {
    const messageManager = new MessageManager();
    switch (messageType) {
      case EQueueMessageType.PUBLISHED:
        return new MessageBrowser(
          messageManager,
          new BrowserStorageList(logger),
          messageType,
          'keyQueuePublished',
          false,
          logger,
        );

      case EQueueMessageType.SCHEDULED:
        return new MessageBrowser(
          messageManager,
          new BrowserStorageSortedSet(logger),
          messageType,
          'keyQueueScheduled',
          false,
          logger,
        );

      case EQueueMessageType.PENDING:
        return this.createPendingMessagesBrowser(
          queueType,
          messageType,
          logger,
        );

      case EQueueMessageType.ACKNOWLEDGED:
        return new MessageBrowser(
          messageManager,
          new BrowserStorageList(logger),
          messageType,
          'keyQueueAcknowledged',
          false,
          logger,
        );

      case EQueueMessageType.DEAD_LETTERED:
        return new MessageBrowser(
          messageManager,
          new BrowserStorageList(logger),
          messageType,
          'keyQueueDL',
          false,
          logger,
        );

      default:
        throw new Error(`Unsupported message type: ${messageType}`);
    }
  }

  static createBrowserForQueue(
    queue: IQueueParams,
    messageType: EQueueMessageType,
    logger: ILogger,
    cb: ICallback<IMessageBrowser>,
  ): void {
    withSharedPoolConnection((client, callback) => {
      _getQueueProperties(client, queue, (err, properties) => {
        if (err) return callback(err);
        if (!properties) return callback(new CallbackEmptyReplyError());

        try {
          const browser = this.createBrowserForQueueType(
            messageType,
            properties.queueType,
            logger,
          );
          callback(null, browser);
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          callback(err);
        }
      });
    }, cb);
  }
}
