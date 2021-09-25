import {
  TApplication,
  TResponsePaginationBody,
  TRequestContext,
} from '../../../../types/common';
import { Message } from '../../../../../message';
import { GetScheduledMessagesRequestDTO } from './get-scheduled-messages-request.DTO';

type TGetScheduledMessagesContext = TRequestContext<
  GetScheduledMessagesRequestDTO,
  TResponsePaginationBody<Message>
>;

export function GetScheduledMessagesHandler(app: TApplication) {
  return async (ctx: TGetScheduledMessagesContext) => {
    const { SchedulerService } = app.context.services;
    return SchedulerService().getSchedulerMessages(ctx.state.dto);
  };
}
