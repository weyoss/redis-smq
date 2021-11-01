import { TApplication } from '../../../../types/common';
import { TDeleteMessageContext } from '../../../common/context';

export function DeleteAcknowledgedMessageHandler(app: TApplication) {
  return async (ctx: TDeleteMessageContext) => {
    const { messageManagerService } = app.context.services;
    return messageManagerService.deleteAcknowledgedMessage(ctx.state.dto);
  };
}
