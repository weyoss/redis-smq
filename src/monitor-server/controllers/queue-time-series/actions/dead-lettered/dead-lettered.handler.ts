import { TApplication } from '../../../../types/common';
import { TQueueTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function DeadLetteredHandler(app: TApplication) {
  return async (ctx: TQueueTimeSeriesRequestContext) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.deadLettered(ctx.state.dto);
  };
}
