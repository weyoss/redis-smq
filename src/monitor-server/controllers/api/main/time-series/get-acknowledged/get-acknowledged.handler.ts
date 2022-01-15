import { TApplication } from '../../../../../types/common';
import { TTimeSeriesRequestContext } from '../../../queues/queue/producer/time-series/context';

export function GetAcknowledgedHandler(app: TApplication) {
  return async (ctx: TTimeSeriesRequestContext) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.acknowledged(ctx.state.dto);
  };
}
