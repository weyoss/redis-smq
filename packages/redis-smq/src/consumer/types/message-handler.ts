import { IMessageTransferable } from '../../message/index.js';
import { ICallback } from 'redis-smq-common';
import { IQueueParsedParams } from '../../queue-manager/index.js';

export type TConsumerMessageHandlerCallback = (
  msg: IMessageTransferable,
  cb: ICallback<void>,
) => void;

export type TConsumerMessageHandlerPromise = (
  msg: IMessageTransferable,
) => Promise<void>;

export type TConsumerMessageHandlerFn =
  | TConsumerMessageHandlerCallback
  | TConsumerMessageHandlerPromise;

export type TConsumerMessageHandler = string | TConsumerMessageHandlerFn;

export interface IConsumerMessageHandlerParams {
  queue: IQueueParsedParams;
  messageHandler: TConsumerMessageHandler;
}
