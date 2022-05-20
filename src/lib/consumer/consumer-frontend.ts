import {
  ICallback,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../types';
import { EventEmitter } from 'events';
import { Consumer } from './consumer';
import { Queue } from '../queue-manager/queue';

export class ConsumerFrontend extends EventEmitter {
  private consumer: Consumer;

  constructor(useMultiplexing = false) {
    super();
    this.consumer = new Consumer(useMultiplexing);
  }

  consume(
    queue: string | TQueueParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(queue);
    return this.consumer.consume(queueParams, messageHandler, cb);
  }

  cancel(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(queue);
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
