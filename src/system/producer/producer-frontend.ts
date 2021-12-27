import { Producer } from './producer';
import { ICallback, IConfig, TQueueParams } from '../../../types';
import { EventEmitter } from 'events';
import { events } from '../common/events';

export class ProducerFrontend extends EventEmitter {
  private producer: Producer;

  constructor(queueName: string, config: IConfig = {}) {
    super();
    this.producer = new Producer(queueName, config);
    this.registerEvents();
  }

  private registerEvents() {
    this.producer
      .on(events.UP, (...args: unknown[]) => this.emit(events.UP, ...args))
      .on(events.DOWN, (...args: unknown[]) => this.emit(events.DOWN, ...args))
      .on(events.MESSAGE_PRODUCED, (...args: unknown[]) =>
        this.emit(events.MESSAGE_PRODUCED, ...args),
      );
  }

  run(cb?: ICallback<void>): void {
    this.producer.run(cb);
  }

  shutdown(cb?: ICallback<void>): void {
    this.producer.shutdown(cb);
  }

  isGoingUp(): boolean {
    return this.producer.isGoingUp();
  }

  isGoingDown(): boolean {
    return this.producer.isGoingDown();
  }

  isUp(): boolean {
    return this.producer.isUp();
  }

  isDown(): boolean {
    return this.producer.isDown();
  }

  isRunning(): boolean {
    return this.producer.isRunning();
  }

  getId(): string {
    return this.producer.getId();
  }

  getQueue(): TQueueParams {
    return this.producer.getQueue();
  }

  produceMessage(msg: unknown, cb: ICallback<boolean>): void {
    this.producer.produceMessage(msg, cb);
  }
}
