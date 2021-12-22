import { TApplication } from '../../../../types/common';
import { TConsumerTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function UnacknowledgedHandler(app: TApplication) {
  return async (ctx: TConsumerTimeSeriesRequestContext) => {
    const { consumerTimeSeriesService } = app.context.services;
    return consumerTimeSeriesService.unacknowledged(ctx.state.dto);
  };
}
