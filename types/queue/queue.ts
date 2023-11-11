export enum EQueueType {
  LIFO_QUEUE,
  FIFO_QUEUE,
  PRIORITY_QUEUE,
}

export interface IQueueParams {
  name: string;
  ns: string;
}

export interface IQueueRateLimit {
  limit: number;
  interval: number;
}

export interface IQueueProperties {
  [EQueueProperty.QUEUE_TYPE]: EQueueType;
  [EQueueProperty.RATE_LIMIT]: IQueueRateLimit | null;
  [EQueueProperty.EXCHANGE]: string | null;
  [EQueueProperty.MESSAGES_COUNT]: number;
}

export enum EQueueProperty {
  QUEUE_TYPE,
  RATE_LIMIT,
  EXCHANGE,
  MESSAGES_COUNT,
}
