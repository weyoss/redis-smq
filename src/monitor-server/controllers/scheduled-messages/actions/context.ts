import { TRequestContext } from '../../../types/common';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages/get-scheduled-messages-request.DTO';
import { GetMessagesResponseBodyDataDTO } from '../../messages/common/get-messages-response-body.DTO';
import { DeleteScheduledMessageRequestDTO } from './delete-scheduled-message/delete-scheduled-message-request.DTO';

export type TGetScheduledMessagesContext = TRequestContext<
  GetScheduledMessagesRequestDTO,
  GetMessagesResponseBodyDataDTO
>;
export type TDeleteScheduledMessageContext =
  TRequestContext<DeleteScheduledMessageRequestDTO>;
