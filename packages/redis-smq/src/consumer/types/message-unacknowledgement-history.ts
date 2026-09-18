import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
} from './message-unacknowledgement.js';
import { IQueueParsedParams } from '../../queue-manager/index.js';

export interface IMessageUnacknowledgementRecord {
  messageId: string;
  queue: IQueueParsedParams;
  consumerId: string;
  cause: EMessageUnacknowledgementCause;
  action: EMessageUnacknowledgementAction;
  deadLetterCause?: EMessageDeadLetterCause;
  timestamp: number;
  retryCount: number;
}

export type TMessageUnacknowledgementHistory =
  IMessageUnacknowledgementRecord[];
