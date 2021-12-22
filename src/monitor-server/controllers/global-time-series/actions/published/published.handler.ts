import { TApplication } from '../../../../types/common';
import { TTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function PublishedHandler(app: TApplication) {
  return async (ctx: TTimeSeriesRequestContext) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.published(ctx.state.dto);
  };
}
