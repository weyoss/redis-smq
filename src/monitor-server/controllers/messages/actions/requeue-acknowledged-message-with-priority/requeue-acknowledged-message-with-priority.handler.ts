import { TApplication } from '../../../../types/common';
import { TRequeueMessageWithPriorityContext } from '../../../common/context';

export function RequeueAcknowledgedMessageWithPriorityHandler(
  app: TApplication,
) {
  return async (ctx: TRequeueMessageWithPriorityContext) => {
    const { messageManagerService } = app.context.services;
    await messageManagerService.requeueAcknowledgedMessageWithPriority(
      ctx.state.dto,
    );
  };
}
