import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../../../common/context';

export function DeletePendingMessageHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.deletePendingMessage(ctx.state.dto);
  };
}
