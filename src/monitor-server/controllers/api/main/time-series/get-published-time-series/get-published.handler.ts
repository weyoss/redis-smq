import { TApplication } from '../../../../../types/common';
import { TTimeSeriesRequestContext } from '../../../queues/queue/time-series/context';

export function GetPublishedHandler(app: TApplication) {
  return async (ctx: TTimeSeriesRequestContext) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.published(ctx.state.dto);
  };
}
