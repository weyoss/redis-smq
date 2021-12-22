import { TApplication } from '../../../../types/common';
import { TQueueTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function UnacknowledgedHandler(app: TApplication) {
  return async (ctx: TQueueTimeSeriesRequestContext) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.unacknowledged(ctx.state.dto);
  };
}
