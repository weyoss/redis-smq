import { IEventProvider } from '../../../types';
import { EventEmitter } from 'events';

export class EventProvider implements IEventProvider {
  protected eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  // type-coverage:ignore-next-line
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
}
