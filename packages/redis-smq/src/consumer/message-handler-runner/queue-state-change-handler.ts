/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueOperationalState,
  IQueueParams,
  IQueueParsedParams,
} from '../../queue-manager/index.js';
import { MessageHandlerRunner } from './message-handler-runner.js';
import { InternalEventBus } from '../../event-bus/internal-event-bus.js';
import { IQueueStateTransition } from '../../queue-state-manager/index.js';
import { ICallback, ILogger } from 'redis-smq-common';

export class QueueStateChangeHandler {
  protected readonly messageHandlerRunner;
  protected readonly internalEventBus;
  protected readonly logger;

  protected readonly pausedQueues = new Map<string, IQueueParams>();
  protected readonly stoppedQueues = new Map<string, IQueueParams>();
  protected readonly lockedQueues = new Map<string, IQueueParams>();

  constructor(messageHandlerRunner: MessageHandlerRunner, logger: ILogger) {
    this.messageHandlerRunner = messageHandlerRunner;
    this.logger = logger.createLogger(this.constructor.name);
    this.internalEventBus = InternalEventBus.getInstance();
    this.internalEventBus.on('queue.stateChanged', this.onQueueStateChange);

    this.logger.debug('QueueStateChangeHandler initialized');
  }

  protected onQueueStateChange = (
    queue: IQueueParams,
    transition: IQueueStateTransition,
  ) => {
    const queueKey = this.getQueueKey(queue);

    const fromState = transition.from;
    const toState = transition.to;

    this.logger.info(
      `Queue state changed: ${queueKey} from ${fromState} to ${toState}`,
    );

    // Remove from all states first
    this.stoppedQueues.delete(queueKey);
    this.pausedQueues.delete(queueKey);
    this.lockedQueues.delete(queueKey);

    switch (toState) {
      case EQueueOperationalState.STOPPED:
        this.stoppedQueues.set(queueKey, queue);
        this.handleQueueStopped(queue);
        break;

      case EQueueOperationalState.PAUSED:
        this.pausedQueues.set(queueKey, queue);
        this.handleQueuePaused(queue);
        break;

      case EQueueOperationalState.LOCKED:
        this.lockedQueues.set(queueKey, queue);
        this.handleQueueLocked(queue);
        break;

      case EQueueOperationalState.ACTIVE:
        this.handleQueueActive(queue);
        break;

      default:
        this.logger.warn(
          `Unknown queue state: ${toState} for queue: ${queueKey}`,
        );
    }
  };

  protected handleQueueStopped(queue: IQueueParams): void {
    this.logger.debug(`Handling STOPPED state for queue: ${queue.name}`);

    // Get all queue configurations for this queue (across all groups)
    const queueConfigs = this.getQueueConfigurationsForQueue(queue);

    if (queueConfigs.length === 0) {
      this.logger.debug(
        `No queue configurations found for queue: ${queue.name}`,
      );
      return;
    }

    // Stop all handlers for this queue (across all groups)
    this.stopAllQueueHandlers(queueConfigs, 'STOPPED');
  }

  protected handleQueuePaused(queue: IQueueParams): void {
    this.logger.debug(`Handling PAUSED state for queue: ${queue.name}`);

    // Get all queue configurations for this queue (across all groups)
    const queueConfigs = this.getQueueConfigurationsForQueue(queue);

    if (queueConfigs.length === 0) {
      this.logger.debug(
        `No queue configurations found for queue: ${queue.name}`,
      );
      return;
    }

    // Stop all handlers for this queue (across all groups)
    this.stopAllQueueHandlers(queueConfigs, 'PAUSED');
  }

  protected handleQueueLocked(queue: IQueueParams): void {
    this.logger.debug(`Handling LOCKED state for queue: ${queue.name}`);

    // Get all queue configurations for this queue (across all groups)
    const queueConfigs = this.getQueueConfigurationsForQueue(queue);

    if (queueConfigs.length === 0) {
      this.logger.debug(
        `No queue configurations found for queue: ${queue.name}`,
      );
      return;
    }

    // Stop all handlers for this queue (across all groups)
    this.stopAllQueueHandlers(queueConfigs, 'LOCKED');
  }

  protected handleQueueActive(queue: IQueueParams): void {
    this.logger.debug(`Handling ACTIVE state for queue: ${queue.name}`);

    // Get all queue configurations for this queue (across all groups)
    const queueConfigs = this.getQueueConfigurationsForQueue(queue);

    if (queueConfigs.length === 0) {
      this.logger.debug(
        `No queue configurations found for queue: ${queue.name}`,
      );
      return;
    }

    // Start all handlers for this queue (across all groups)
    this.startAllQueueHandlers(queueConfigs);
  }

  /**
   * Get all queue configurations for a specific queue (across all consumer groups)
   */
  protected getQueueConfigurationsForQueue(
    queue: IQueueParams,
  ): IQueueParsedParams[] {
    const allQueues = this.messageHandlerRunner.getQueues();
    return allQueues.filter(
      (q) => q.queueParams.ns === queue.ns && q.queueParams.name === queue.name,
    );
  }

  /**
   * Stop all handlers for a queue (across all groups)
   */
  protected stopAllQueueHandlers(
    queueConfigs: IQueueParsedParams[],
    state: 'STOPPED' | 'PAUSED' | 'LOCKED',
  ): void {
    let stoppedCount = 0;
    const totalCount = queueConfigs.length;

    const checkCompletion = () => {
      if (stoppedCount === totalCount) {
        this.logger.info(
          `All ${totalCount} handler(s) for queue ${queueConfigs[0].queueParams.name} have been ${state.toLowerCase()}`,
        );
      }
    };

    queueConfigs.forEach((queueParsed) => {
      this.messageHandlerRunner.stopMessageHandler(
        queueParsed,
        (err, wasRunning) => {
          if (err) {
            this.logger.error(
              `Failed to ${state.toLowerCase()} message handler for queue ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'}):`,
              err,
            );
          } else {
            if (wasRunning) {
              this.logger.debug(
                `Message handler ${state.toLowerCase()} for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'})`,
              );
            }
          }
          stoppedCount++;
          checkCompletion();
        },
      );
    });
  }

  /**
   * Start all handlers for a queue (across all groups)
   */
  protected startAllQueueHandlers(queueConfigs: IQueueParsedParams[]): void {
    let startedCount = 0;
    const totalCount = queueConfigs.length;

    const checkCompletion = () => {
      if (startedCount === totalCount) {
        this.logger.info(
          `All ${totalCount} handler(s) for queue ${queueConfigs[0].queueParams.name} have been started (ACTIVE state)`,
        );
      }
    };

    queueConfigs.forEach((queueParsed) => {
      // Check if handler is already running
      if (this.messageHandlerRunner.isMessageHandlerRunning(queueParsed)) {
        this.logger.debug(
          `Message handler already running for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'})`,
        );
        startedCount++;
        checkCompletion();
        return;
      }

      // Check if configuration exists
      const handlerConfig =
        this.messageHandlerRunner.getMessageHandler(queueParsed);
      if (!handlerConfig) {
        this.logger.debug(
          `No handler configuration found for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'}), skipping`,
        );
        startedCount++;
        checkCompletion();
        return;
      }

      // Start the handler
      this.messageHandlerRunner.startMessageHandler(
        queueParsed,
        (err, wasStarted) => {
          if (err) {
            this.logger.error(
              `Failed to start message handler for queue ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'}):`,
              err,
            );
          } else {
            if (wasStarted) {
              this.logger.debug(
                `Message handler started for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'})`,
              );
            }
          }
          startedCount++;
          checkCompletion();
        },
      );
    });
  }

  /**
   * Check if a queue is stopped
   */
  isQueueStopped(queueParams: IQueueParams): boolean {
    const queueKey = this.getQueueKey(queueParams);
    return this.stoppedQueues.has(queueKey);
  }

  /**
   * Check if a queue is paused
   */
  isQueuePaused(queueParams: IQueueParams): boolean {
    const queueKey = this.getQueueKey(queueParams);
    return this.pausedQueues.has(queueKey);
  }

  /**
   * Check if a queue is locked
   */
  isQueueLocked(queueParams: IQueueParams): boolean {
    const queueKey = this.getQueueKey(queueParams);
    return this.lockedQueues.has(queueKey);
  }

  /**
   * Check if a queue is active (not stopped, paused, or locked)
   */
  isQueueActive(queueParams: IQueueParams): boolean {
    const queueKey = this.getQueueKey(queueParams);
    return (
      !this.stoppedQueues.has(queueKey) &&
      !this.pausedQueues.has(queueKey) &&
      !this.lockedQueues.has(queueKey)
    );
  }

  /**
   * Get all stopped queues
   */
  getStoppedQueues(): IQueueParams[] {
    return Array.from(this.stoppedQueues.values());
  }

  /**
   * Get all paused queues
   */
  getPausedQueues(): IQueueParams[] {
    return Array.from(this.pausedQueues.values());
  }

  /**
   * Get all locked queues
   */
  getLockedQueues(): IQueueParams[] {
    return Array.from(this.lockedQueues.values());
  }

  /**
   * Stop listening for state changes and clean up
   */
  shutdown = (cb: ICallback): void => {
    this.internalEventBus.removeListener(
      'queue.stateChanged',
      this.onQueueStateChange,
    );
    this.stoppedQueues.clear();
    this.pausedQueues.clear();
    this.lockedQueues.clear();
    this.logger.debug('QueueStateChangeHandler destroyed');
    cb();
  };

  /**
   * Get queue key for state tracking
   */
  private getQueueKey(queueParams: IQueueParams | IQueueParsedParams): string {
    // Only use namespace and name for state tracking, not groupId
    // Queue state is shared across all consumer groups
    if ('queueParams' in queueParams) {
      return `${queueParams.queueParams.ns}:${queueParams.queueParams.name}`;
    }
    return `${queueParams.ns}:${queueParams.name}`;
  }
}
