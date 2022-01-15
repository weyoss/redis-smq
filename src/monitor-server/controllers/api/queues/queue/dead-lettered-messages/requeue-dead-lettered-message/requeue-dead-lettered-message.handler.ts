import { TApplication } from '../../../../../../types/common';
import { TRequeueMessageContext } from '../../context';

export function RequeueDeadLetteredMessageHandler(app: TApplication) {
  return async (ctx: TRequeueMessageContext) => {
    const { messagesService } = app.context.services;
    await messagesService.requeueDeadLetteredMessage(ctx.state.dto);
  };
}
