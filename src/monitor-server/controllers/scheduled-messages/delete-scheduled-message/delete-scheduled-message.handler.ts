import { TApplication } from '../../../types/common';
import { TDeleteScheduledMessageContext } from '../../common/context';

export function DeleteScheduledMessageHandler(app: TApplication) {
  return async (ctx: TDeleteScheduledMessageContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.deleteScheduledMessage(ctx.state.dto);
  };
}
