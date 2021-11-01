import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../../../common/context';

export function DeletePendingMessageWithPriorityHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.deletePendingMessageWithPriority(
      ctx.state.dto,
    );
  };
}
