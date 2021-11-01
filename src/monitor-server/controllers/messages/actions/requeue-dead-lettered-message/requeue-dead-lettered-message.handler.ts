import { TApplication } from '../../../../types/common';
import { TRequeueMessageContext } from '../../../common/context';

export function RequeueDeadLetteredMessageHandler(app: TApplication) {
  return async (ctx: TRequeueMessageContext) => {
    const { messageManagerService } = app.context.services;
    await messageManagerService.requeueDeadLetteredMessage(ctx.state.dto);
  };
}
