import {
  TApplication,
  TResponsePaginationBody,
  TRequestContext,
} from '../../../../types/common';
import { Message } from '../../../../../system/message';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages-request.DTO';

type TGetScheduledMessagesContext = TRequestContext<
  GetScheduledMessagesRequestDTO,
  TResponsePaginationBody<Message>
>;

export function GetScheduledMessagesHandler(app: TApplication) {
  return async (ctx: TGetScheduledMessagesContext) => {
    const { MessageManagerService } = app.context.services;
    return MessageManagerService().getScheduledMessages(ctx.state.dto);
  };
}
