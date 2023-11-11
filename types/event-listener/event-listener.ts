import { ICallback } from 'redis-smq-common';
import { EventEmitter } from 'events';

export type TEventListenerInitArgs = {
  eventProvider: EventEmitter;
  instanceId: string;
};

export interface IEventListener {
  init(args: TEventListenerInitArgs, cb: ICallback<void>): void;
  quit(cb: ICallback<void>): void;
}
