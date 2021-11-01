import { TApplication } from '../../../../types/common';
import { TRequeueMessageContext } from '../../../common/context';

export function RequeueAcknowledgedMessageHandler(app: TApplication) {
  return async (ctx: TRequeueMessageContext) => {
    const { messageManagerService } = app.context.services;
    await messageManagerService.requeueAcknowledgedMessage(ctx.state.dto);
  };
}
