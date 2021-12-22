import { TApplication } from '../../../../types/common';
import { TQueueTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function ProcessingHandler(app: TApplication) {
  return async (ctx: TQueueTimeSeriesRequestContext) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.processing(ctx.state.dto);
  };
}
