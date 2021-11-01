import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../../../common/context';

export function DeleteDeadLetteredMessageHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.deleteDeadLetteredMessage(ctx.state.dto);
  };
}
