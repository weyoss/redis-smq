import { TRequestContext } from '../../../types/common';
import { GetMessagesRequestDTO } from '../common/get-messages-request.DTO';
import { GetMessagesResponseBodyDataDTO } from '../common/get-messages-response-body.DTO';
import { DeleteMessageRequestDTO } from '../common/delete-message-request.DTO';
import { RequeueMessageRequestDTO } from '../common/requeue-message-request.DTO';
import { PurgeMessagesRequestDTO } from '../common/purge-messages-request.DTO';

export type TGetMessagesContext = TRequestContext<
  GetMessagesRequestDTO,
  GetMessagesResponseBodyDataDTO
>;
export type TDeleteMessageContext = TRequestContext<DeleteMessageRequestDTO>;
export type TRequeueMessageContext = TRequestContext<RequeueMessageRequestDTO>;
export type TPurgeQueueContext = TRequestContext<PurgeMessagesRequestDTO>;
