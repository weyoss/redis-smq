import { TApplication } from '../../../../../types/common';
import { TTimeSeriesRequestContext } from '../../../queues/queue/time-series/context';

export function GetDeadLetteredHandler(app: TApplication) {
  return async (ctx: TTimeSeriesRequestContext) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.deadLettered(ctx.state.dto);
  };
}
