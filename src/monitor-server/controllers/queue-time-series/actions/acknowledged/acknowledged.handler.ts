import { TApplication } from '../../../../types/common';
import { TQueueTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function AcknowledgedHandler(app: TApplication) {
  return async (ctx: TQueueTimeSeriesRequestContext) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.acknowledged(ctx.state.dto);
  };
}
