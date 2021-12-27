import { TApplication } from '../../../../types/common';
import { TTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function DeadLetteredHandler(app: TApplication) {
  return async (ctx: TTimeSeriesRequestContext) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.deadLettered(ctx.state.dto);
  };
}
