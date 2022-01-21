import {
  ICallback,
  IConfig,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../types';
import { EventEmitter } from 'events';
import { Consumer } from './consumer';
import { events } from '../common/events';

export class ConsumerFrontend extends EventEmitter {
  private consumer: Consumer;

  constructor(config: IConfig = {}) {
    super();
    this.consumer = new Consumer(config);
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
      .on(events.MESSAGE_RECEIVED, (...args: unknown[]) =>
        this.emit(events.MESSAGE_RECEIVED, ...args),
      );
  }

  consume(
    queue: string | TQueueParams,
    usePriorityQueuing: boolean,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<boolean>,
  ): void {
    return this.consumer.consume(queue, usePriorityQueuing, messageHandler, cb);
  }

  run(cb?: ICallback<void>): void {
    this.consumer.run(cb);
  }

  shutdown(cb?: ICallback<void>): void {
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
}
