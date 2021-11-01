import { TApplication } from '../../../../types/common';
import { TGetMessagesContext } from '../../../common/context';

export function GetAcknowledgedMessagesHandler(app: TApplication) {
  return async (ctx: TGetMessagesContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.getAcknowledgedMessages(ctx.state.dto);
  };
}
