import { ICallback, IConfig } from '../../../types';
import { EventEmitter } from 'events';
import { events } from '../common/events';
import { Producer } from './producer';
import { Message } from '../message';

export class ProducerFrontend extends EventEmitter {
  private producer: Producer;

  constructor(config: IConfig = {}) {
    super();
    this.producer = new Producer(config);
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

  run(cb?: ICallback<boolean>): void {
    this.producer.run(cb);
  }

  shutdown(cb?: ICallback<boolean>): void {
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

  produce(msg: Message, cb: ICallback<boolean>): void {
    this.producer.produce(msg, cb);
  }
}
