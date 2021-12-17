import { TApplication } from '../../../../types/common';
import { TRequeueMessageContext } from '../context';

export function RequeueAcknowledgedMessageHandler(app: TApplication) {
  return async (ctx: TRequeueMessageContext) => {
    const { messagesService } = app.context.services;
    await messagesService.requeueAcknowledgedMessage(ctx.state.dto);
  };
}
