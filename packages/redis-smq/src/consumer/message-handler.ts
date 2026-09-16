/*
 * packages/redis-smq/src/consumer/message-handler.ts
 */

import path from 'path';
import {
  CallbackEmptyReplyError,
  CallbackInvalidReplyError,
  env,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
  Runnable,
  Timer,
  WorkerCluster,
} from 'redis-smq-common';
import { ERedisScriptName } from '../common/scripts/registry.js';
import { keys as redisKeys } from '../common/redis/keys/keys.js';
import { IRedisSMQParsedConfig } from '../config-manager/index.js';
import { _parseMessage } from '../message-manager/_/_parse-message.js';
import { EMessageProperty, EMessagePropertyStatus } from '../message/index.js';
import { MessageEnvelope } from '../message/message-envelope.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParsedParams,
} from '../queue-manager/index.js';
import { DequeueMessage, TDequeueMessageEvent } from './dequeue-message.js';
import { MessageConsumer } from './message-consumer.js';
import { AcknowledgementPipeline } from './acknowledgement-pipeline.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
} from './types/index.js';
import {
  IConsumerMessageHandlerParams,
  TConsumerMessageHandler,
} from './types/index.js';
import { ERedisConnectionAcquisitionMode } from '../common/redis/connection-pool/types/connection-pool.js';
import { Pool } from '../common/redis/connection-pool/pool.js';
import { _subscribeConsumer } from './_/_subscribe-consumer.js';
import { _unsubscribeConsumer } from './_/_unsubscribe-consumer.js';
import { IConsumerContext } from './types/consumer-context.js';
import { IQueueWorkerPayload } from './types/queue-worker.js';
import { Config } from '../common/redis/config.js';

/**
 * Events emitted by a MessageHandler.
 *
 * Lifecycle (consumed by the runner):
 *   - error: a fatal failure; the runner tears down the instance.
 *   - shutdownRequired: the queue is STOPPED/LOCKED; the runner removes
 *     the instance so a fresh one can be created when the queue returns
 *     to ACTIVE.
 *
 * Message outcomes (forwarded to EventMultiplexer by event-publisher):
 *   - messageAcknowledged
 *   - messageUnacknowledged
 *   - messageDeadLettered
 *   - messageRequeued
 *   - messageDelayed
 */
export type TMessageHandlerEvent = {
  error: (err: Error, consumerId: string, queue: IQueueParsedParams) => void;
  shutdownRequired: (
    cause: EMessageUnacknowledgementCause,
    consumerId: string,
    queue: IQueueParsedParams,
  ) => void;
  messageAcknowledged: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  messageUnacknowledged: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
    unacknowledgmentCause: EMessageUnacknowledgementCause,
  ) => void;
  messageDeadLettered: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
    deadLetterCause: EMessageDeadLetterCause,
  ) => void;
  messageRequeued: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  messageDelayed: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
};

/**
 * Options that control how a handler runs:
 *   - autoDequeue: whether goingUp self-starts the dequeue loop
 *   - blockUntilMessageReceived: BRPOPLPUSH vs. RPOPLPUSH (and, by
 *     extension, whether DequeueMessage auto-closes its Redis connection)
 *   - nextFn: how to yield after a message. Null means "loop on yourself"
 *     (non-multiplexed). A function means "hand control back to the
 *     caller" (multiplexed).
 */
export interface IMessageHandlerOptions {
  autoDequeue?: boolean;
  blockUntilMessageReceived?: boolean;
  nextFn?: (() => void) | null;
}

const WORKERS_DIR = path.resolve(env.getCurrentDir(), './workers');

export class MessageHandler extends Runnable<TMessageHandlerEvent> {
  protected readonly consumerContext: IConsumerContext;
  protected readonly config: IRedisSMQParsedConfig;

  protected logger: ILogger;
  protected queue: IQueueParsedParams;
  protected messageHandler: TConsumerMessageHandler;
  protected dequeueMessage: DequeueMessage | null = null;
  protected acknowledgementPipeline: AcknowledgementPipeline | null = null;
  protected messageConsumer: MessageConsumer | null = null;
  protected queueWorkerCluster: WorkerCluster | null = null;
  protected redisClient: IRedisClient | null = null;
  protected timer: Timer;

  protected readonly autoDequeue: boolean;
  protected readonly blockUntilMessageReceived: boolean;
  protected readonly nextFn: (() => void) | null;

  constructor(
    consumerContext: IConsumerContext,
    handlerParams: IConsumerMessageHandlerParams,
    options: IMessageHandlerOptions = {},
  ) {
    super();
    this.consumerContext = consumerContext;
    this.logger = consumerContext.logger.createLogger(this.constructor.name);
    this.config = consumerContext.config;

    const { queue, messageHandler } = handlerParams;
    this.queue = queue;
    this.messageHandler = messageHandler;
    this.autoDequeue = options.autoDequeue ?? true;
    this.blockUntilMessageReceived = options.blockUntilMessageReceived ?? true;
    this.nextFn = options.nextFn ?? null;
    this.timer = new Timer(this.logger);
  }

  protected getRedisClient(): IRedisClient | PanicError {
    if (!this.redisClient)
      return new PanicError({ message: 'A Client instance is required.' });
    return this.redisClient;
  }

  protected onMessageReceived: TDequeueMessageEvent['messageReceived'] = (
    messageId,
  ) => {
    this.processMessage(messageId);
  };

  /**
   * Called by DequeueMessage when no message was available.
   *
   * Multiplexed mode yields to the controller immediately; the
   * controller's tick interval is the retry delay. Non-multiplexed mode
   * schedules its own retry, throttling empty-queue polling to one
   * attempt per second.
   */
  protected onMessageNext: TDequeueMessageEvent['nextMessage'] = () => {
    if (this.nextFn) {
      this.next();
      return;
    }
    this.timer.schedule(() => this.next(), 1000);
  };

  protected override handleError(err: Error) {
    if (!this.isOperational()) return;

    this.logger.error(`MessageHandler error: ${err.message}`, err);
    this.emit('error', err, this.consumerContext.consumerId, this.queue);
    super.handleError(err);
  }

  protected runWorkerCluster = (cb: ICallback): void => {
    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      return cb(redisClient);
    }

    const { keyQueueWorkersLock } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );
    this.queueWorkerCluster = new WorkerCluster(
      redisClient,
      this.logger,
      keyQueueWorkersLock,
    );
    this.queueWorkerCluster.on('workerCluster.error', (err) =>
      this.handleError(err),
    );
    this.queueWorkerCluster.loadFromDir<IQueueWorkerPayload>(
      WORKERS_DIR,
      {
        config: this.config,
        redisConfig: Config.getConfig(),
        queueParsedParams: this.queue,
        loggerContext: {
          namespaces: this.logger.getNamespaces(),
        },
        consumerId: this.consumerContext.consumerId,
      },
      (err) => {
        if (err) return cb(err);

        // This operation may hang on forever as
        // the callback is invoked only when a lock is acquired
        this.queueWorkerCluster?.run(() => void 0);
        cb();
      },
    );
  };

  protected shutdownWorkerCluster = (cb: ICallback): void => {
    if (this.queueWorkerCluster) {
      this.queueWorkerCluster.shutdown(() => {
        this.queueWorkerCluster = null;
        cb();
      });
    } else cb();
  };

  /**
   * A factory for DequeueMessage. The blocking flags follow the handler's
   * mode:
   *   - non-multiplexed: blocking = true, autoClose = true
   *   - multiplexed:     blocking = false, autoClose = false
   */
  protected createDequeueMessageInstance(): DequeueMessage {
    const blocking = this.blockUntilMessageReceived;
    return new DequeueMessage(
      this.consumerContext,
      this.queue,
      blocking,
      blocking,
    );
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => this.timer.run(cb),
      (cb: ICallback) => {
        Pool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            cb();
          },
        );
      },
      // Consumer group resolution happened in the runner before this
      // handler was constructed; the queue is already fully resolved.
      (cb: ICallback) => {
        _subscribeConsumer(this.consumerContext.consumerId, this.queue, cb);
      },
      // Start the acknowledgement pipeline (unacknowledger first, then
      // acknowledger). The pipeline is the IMessageControl that
      // MessageConsumer will call into.
      (cb: ICallback) => {
        const pipeline = new AcknowledgementPipeline(
          this.queue,
          this.consumerContext.consumerId,
          this.logger,
          this.consumerContext.consumerOptions,
        );
        this.attachPipelineListeners(pipeline);
        this.acknowledgementPipeline = pipeline;
        pipeline.run(cb);
      },
      // Construct the consumer and validate the handler's shape before
      // any message is processed.
      (cb: ICallback) => {
        const pipeline = this.acknowledgementPipeline;
        if (!pipeline) {
          return cb(new PanicError({ message: 'Pipeline not initialized' }));
        }
        const mc = new MessageConsumer(
          this.messageHandler,
          this.queue,
          pipeline,
          this.logger,
        );
        this.messageConsumer = mc;
        mc.validateHandler(cb);
      },
      (cb: ICallback) => {
        this.dequeueMessage = this.createDequeueMessageInstance();
        this.dequeueMessage.on('error', (err) => this.handleError(err));
        this.dequeueMessage.on('messageReceived', this.onMessageReceived);
        this.dequeueMessage.on('nextMessage', this.onMessageNext);
        this.dequeueMessage.run(cb);
      },
      this.runWorkerCluster,
      (cb: ICallback) => {
        if (this.autoDequeue) {
          this.dequeue();
        }
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => this.timer.shutdown(cb),
      this.shutdownWorkerCluster,

      // stop dequeuing messages
      (cb: ICallback) => {
        if (this.dequeueMessage) {
          this.dequeueMessage.shutdown(() => {
            this.dequeueMessage?.removeListener('error', (err) =>
              this.handleError(err),
            );
            this.dequeueMessage?.removeListener(
              'messageReceived',
              this.onMessageReceived,
            );
            this.dequeueMessage?.removeListener(
              'nextMessage',
              this.onMessageNext,
            );
            this.dequeueMessage = null;
            cb();
          });
        } else cb();
      },

      // Stop the acknowledgement pipeline first (acknowledger, then
      // unacknowledger). This matches the pre-Step-6 ordering: acks are
      // flushed while the workers is still alive, so any in-flight workers
      // completion can still enqueue its outcome before the pipeline
      // stops accepting requests.
      (cb: ICallback) => {
        const pipeline = this.acknowledgementPipeline;
        if (!pipeline) return cb();
        this.acknowledgementPipeline = null;
        pipeline.shutdown(cb);
      },

      // Then shut down MessageConsumer (releases the workers, if any).
      (cb: ICallback) => {
        const mc = this.messageConsumer;
        if (!mc) return cb();
        this.messageConsumer = null;
        mc.shutdown(cb);
      },

      // unsubscribe from queue (must run before the runner deletes the
      // ephemeral group — the delete script refuses while a consumer is
      // still a member)
      (cb: ICallback) => {
        _unsubscribeConsumer(this.consumerContext.consumerId, this.queue, cb);
      },

      (cb: ICallback) => {
        if (this.redisClient) {
          Pool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  processMessage(messageId: string): void {
    if (!this.isOperational() || !this.messageConsumer) {
      return;
    }
    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      return this.handleError(redisClient);
    }

    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const { keyQueueProperties } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );

    const keys: string[] = [keyMessage, keyQueueProperties];
    const argv: (string | number)[] = [
      EMessageProperty.PROCESSING_STARTED_AT,
      EMessageProperty.LAST_PROCESSED_AT,
      Date.now(),
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PROCESSING,
      EMessagePropertyStatus.PENDING,
      EMessageProperty.ATTEMPTS,
      EQueueProperty.PROCESSING_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
      EQueueProperty.OPERATIONAL_STATE,
      EQueueOperationalState.ACTIVE,
      EQueueOperationalState.PAUSED,
      EQueueOperationalState.STOPPED,
      EQueueOperationalState.LOCKED,
    ];

    redisClient.runScript(
      ERedisScriptName.CHECKOUT_MESSAGE,
      keys,
      argv,
      (err, reply: unknown) => {
        if (err) return this.handleError(err);

        // Queue-state branches: signal the runner, do NOT self-shutdown.
        // The runner owns the instance's lifecycle and must remove it
        // from its registry so a fresh handler can be created when the
        // queue returns to ACTIVE.
        if (reply === 'QUEUE_STOPPED') {
          this.logger.warn(
            `Cannot checkout message ${messageId}: Queue is in STOPPED state. Requesting shutdown of this message handler.`,
          );
          this.emit(
            'shutdownRequired',
            EMessageUnacknowledgementCause.QUEUE_STOPPED,
            this.consumerContext.consumerId,
            this.queue,
          );
          return;
        }

        if (reply === 'QUEUE_LOCKED') {
          this.logger.warn(
            `Cannot checkout message ${messageId}: Queue is in LOCKED state. Requesting shutdown of this message handler.`,
          );
          this.emit(
            'shutdownRequired',
            EMessageUnacknowledgementCause.QUEUE_LOCKED,
            this.consumerContext.consumerId,
            this.queue,
          );
          return;
        }

        if (reply === 'QUEUE_INVALID_STATE') {
          this.logger.warn(
            `Cannot checkout message ${messageId}: Queue is in invalid state. Requesting shutdown of this message handler.`,
          );
          this.emit(
            'shutdownRequired',
            EMessageUnacknowledgementCause.QUEUE_INVALID_STATE,
            this.consumerContext.consumerId,
            this.queue,
          );
          return;
        }

        if (reply === 'MESSAGE_NOT_FOUND') {
          this.logger.warn(
            `Message [${messageId}] not found. It may have been deleted or expired.`,
          );
          this.next();
          return;
        }

        if (reply === 'MESSAGE_NOT_PENDING') {
          this.logger.warn(
            `Message [${messageId}] could not be fetched. It may have been processed by another consumer.`,
          );
          this.next();
          return;
        }

        if (!reply) {
          this.logger.warn(
            `Message [${messageId}] could not be fetched. It may have been processed by another consumer.`,
          );
          this.next();
          return;
        }
        if (!Array.isArray(reply)) {
          return this.handleError(new CallbackInvalidReplyError());
        }
        const message = _parseMessage(reply);
        this.handleReceivedMessage(message);
      },
    );
  }

  /**
   * Called once CHECKOUT_MESSAGE succeeds. Applies the expired-message
   * shortcut, then delegates to MessageConsumer.
   *
   * Timeout enforcement, outcome recording, and the ack/unack race guard
   * all live in MessageConsumer.consume now. This method only decides
   * whether the message has expired and whether to advance the dequeue
   * loop after the outcome is recorded.
   *
   * The `isOperational()` check in the completion callback matches the
   * pre-Step-6 ConsumeMessage behavior: a handler that completes while
   * the parent is shutting down does not advance the loop. The outcome
   * itself is dropped by the pipeline's own operational guard, and the
   * unacknowledger's `goingDown` will handle any in-flight message with
   * cause SHUTTING_DOWN.
   */
  protected handleReceivedMessage(message: MessageEnvelope): void {
    const messageId = message.getId();
    const pipeline = this.acknowledgementPipeline;
    const consumer = this.messageConsumer;

    if (!this.isOperational() || !consumer || !pipeline) {
      this.logger.warn(
        `Ignoring message ${messageId} - handler not fully operational`,
      );
      return;
    }

    if (message.getSetExpired()) {
      this.logger.info(`Message ${messageId} expired, unacknowledging`);
      pipeline.unack(message, EMessageUnacknowledgementCause.TTL_EXPIRED);
      this.next();
      return;
    }

    consumer.consume(message, () => {
      if (!this.isOperational()) {
        this.logger.debug(
          `Consumer not running, ignoring callback for ${messageId}`,
        );
        return;
      }
      this.next();
    });
  }

  /**
   * Forward AcknowledgementPipeline events.
   *
   * Fatal errors propagate to the handler's error channel, which the
   * runner interprets as a signal to tear the instance down. This
   * matches the pre-Step-6 behavior: an acknowledger or unacknowledger
   * error routed through ConsumeMessage.handleError, which emitted on
   * the handler's error channel.
   *
   * Message outcomes are enriched with queue + consumerId and re-emitted,
   * preserving the shape the old ConsumeMessage emitted.
   */
  protected attachPipelineListeners(pipeline: AcknowledgementPipeline): void {
    pipeline.on('error', (err) => {
      this.handleError(err);
    });

    pipeline.on('messageAcknowledged', (message) => {
      this.emit(
        'messageAcknowledged',
        message.getId(),
        this.queue,
        this.consumerContext.consumerId,
      );
    });

    pipeline.on('messageUnacknowledged', (messageId, cause) => {
      this.emit(
        'messageUnacknowledged',
        messageId,
        this.queue,
        this.consumerContext.consumerId,
        cause,
      );
    });

    pipeline.on('messageDeadLettered', (messageId, deadLetterCause) => {
      this.emit(
        'messageDeadLettered',
        messageId,
        this.queue,
        this.consumerContext.consumerId,
        deadLetterCause,
      );
    });

    pipeline.on('messageRequeued', (messageId) => {
      this.emit(
        'messageRequeued',
        messageId,
        this.queue,
        this.consumerContext.consumerId,
      );
    });

    pipeline.on('messageDelayed', (messageId) => {
      this.emit(
        'messageDelayed',
        messageId,
        this.queue,
        this.consumerContext.consumerId,
      );
    });
  }

  /**
   * Yield control after processing a message or finding the queue empty.
   *
   * - Multiplexed (`nextFn` present): hand control back to the controller.
   * - Non-multiplexed (`nextFn` absent): loop on ourselves.
   */
  next(): void {
    if (this.nextFn) {
      this.nextFn();
      return;
    }

    if (this.isOperational()) {
      this.dequeue();
    }
  }

  dequeue(): void {
    if (this.isOperational() && this.dequeueMessage) {
      this.dequeueMessage.dequeue();
    }
  }

  getQueue(): IQueueParsedParams {
    return this.queue;
  }
}
