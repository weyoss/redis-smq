import { TApplication } from '../../../../types/common';
import { TGetMessagesContext } from '../../../common/context';

export function GetDeadLetteredMessagesHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.getDeadLetteredMessages(ctx.state.dto);
  };
}
