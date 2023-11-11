import { IEventListener } from './event-listener';

export interface IEventListenersConfig {
  consumerEventListeners?: (new () => IEventListener)[];
  producerEventListeners?: (new () => IEventListener)[];
}

export type IEventListenersConfigRequired = Required<IEventListenersConfig>;
