import { TApplication } from '../../../../../../types/common';
import { TQueueTimeSeriesRequestContext } from '../context';

export function GetQueueDeadLetteredHandler(app: TApplication) {
  return async (ctx: TQueueTimeSeriesRequestContext) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.deadLettered(ctx.state.dto);
  };
}
