import {
  ICallback,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../../types';
import { EventEmitter } from 'events';
import { Consumer } from './consumer';
import { events } from '../../common/events';
import { Queue } from '../queue-manager/queue';

export class ConsumerFrontend extends EventEmitter {
  private consumer: Consumer;

  constructor(useMultiplexing = false) {
    super();
    this.consumer = new Consumer(useMultiplexing);
    this.registerEvents();
  }

  private registerEvents() {
    this.consumer
      .on(events.UP, (...args: unknown[]) => this.emit(events.UP, ...args))
      .on(events.DOWN, (...args: unknown[]) => this.emit(events.DOWN, ...args))
      .on(events.IDLE, (...args: unknown[]) => this.emit(events.IDLE, ...args))
      .on(events.MESSAGE_UNACKNOWLEDGED, (...args: unknown[]) =>
        this.emit(events.MESSAGE_UNACKNOWLEDGED, ...args),
      )
      .on(events.MESSAGE_ACKNOWLEDGED, (...args: unknown[]) =>
        this.emit(events.MESSAGE_ACKNOWLEDGED, ...args),
      )
      .on(events.MESSAGE_DEAD_LETTERED, (...args: unknown[]) =>
        this.emit(events.MESSAGE_DEAD_LETTERED, ...args),
      )
      .on(events.MESSAGE_RECEIVED, (...args: unknown[]) =>
        this.emit(events.MESSAGE_RECEIVED, ...args),
      );
  }

  consume(
    queue: string | TQueueParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    return this.consumer.consume(queueParams, messageHandler, cb);
  }

  cancel(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getQueueParams(queue);
    this.consumer.cancel(queueParams, cb);
  }

  run(cb?: ICallback<boolean>): void {
    this.consumer.run(cb);
  }

  shutdown(cb?: ICallback<boolean>): void {
    this.consumer.shutdown(cb);
  }

  isGoingUp(): boolean {
    return this.consumer.isGoingUp();
  }

  isGoingDown(): boolean {
    return this.consumer.isGoingDown();
  }

  isUp(): boolean {
    return this.consumer.isUp();
  }

  isDown(): boolean {
    return this.consumer.isDown();
  }

  isRunning(): boolean {
    return this.consumer.isRunning();
  }

  getId(): string {
    return this.consumer.getId();
  }

  getQueues(): TQueueParams[] {
    return this.consumer.getQueues();
  }
}
