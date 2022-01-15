import { TRequestContext } from '../../../../types/common';
import { GetMessagesRequestDTO } from '../../../common/dto/queues/get-messages-request.DTO';
import { GetMessagesResponseBodyDataDTO } from '../../../common/dto/queues/get-messages-response-body.DTO';
import { DeleteMessageRequestDTO } from '../../../common/dto/queues/delete-message-request.DTO';
import { RequeueMessageRequestDTO } from '../../../common/dto/queues/requeue-message-request.DTO';
import { PurgeMessagesRequestDTO } from '../../../common/dto/queues/purge-messages-request.DTO';

export type TGetMessagesContext = TRequestContext<
  GetMessagesRequestDTO,
  GetMessagesResponseBodyDataDTO
>;
export type TDeleteMessageContext = TRequestContext<DeleteMessageRequestDTO>;
export type TRequeueMessageContext = TRequestContext<RequeueMessageRequestDTO>;
export type TPurgeQueueContext = TRequestContext<PurgeMessagesRequestDTO>;
