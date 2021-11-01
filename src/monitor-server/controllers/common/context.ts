import { TRequestContext } from '../../types/common';
import { GetMessagesRequestDTO } from './get-messages-request.DTO';
import { GetMessagesResponseBodyDataDTO } from './get-messages-response-body.DTO';
import { GetScheduledMessagesRequestDTO } from '../scheduled-messages/get-scheduled-messages/get-scheduled-messages-request.DTO';
import { DeleteScheduledMessageRequestDTO } from '../scheduled-messages/delete-scheduled-message/delete-scheduled-message-request.DTO';
import { DeleteMessageRequestDTO } from './delete-message-request.DTO';
import { PurgeQueueRequestDTO } from './purge-queue-request.DTO';
import { RequeueMessageRequestDTO } from './requeue-message-request.DTO';
import { RequeueMessageWithPriorityRequestDTO } from './requeue-message-with-priority-request.DTO';

export type TGetMessagesContext = TRequestContext<
  GetMessagesRequestDTO,
  GetMessagesResponseBodyDataDTO
>;

export type TDeleteMessageContext = TRequestContext<DeleteMessageRequestDTO>;

export type TGetScheduledMessagesContext = TRequestContext<
  GetScheduledMessagesRequestDTO,
  GetMessagesResponseBodyDataDTO
>;

export type TDeleteScheduledMessageContext =
  TRequestContext<DeleteScheduledMessageRequestDTO>;

export type TPurgeQueueContext = TRequestContext<PurgeQueueRequestDTO>;

export type TRequeueMessageContext = TRequestContext<RequeueMessageRequestDTO>;

export type TRequeueMessageWithPriorityContext =
  TRequestContext<RequeueMessageWithPriorityRequestDTO>;
