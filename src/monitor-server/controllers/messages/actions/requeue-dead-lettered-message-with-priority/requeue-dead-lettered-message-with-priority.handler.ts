import { TApplication } from '../../../../types/common';
import { TRequeueMessageWithPriorityContext } from '../../../common/context';

export function RequeueDeadLetteredMessageWithPriorityHandler(
  app: TApplication,
) {
  return async (ctx: TRequeueMessageWithPriorityContext) => {
    const { messageManagerService } = app.context.services;
    await messageManagerService.requeueDeadLetteredMessageWithPriority(
      ctx.state.dto,
    );
  };
}
