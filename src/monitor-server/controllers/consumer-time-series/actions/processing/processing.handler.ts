import { TApplication } from '../../../../types/common';
import { TConsumerTimeSeriesRequestContext } from '../../../producer-time-series/actions/context';

export function ProcessingHandler(app: TApplication) {
  return async (ctx: TConsumerTimeSeriesRequestContext) => {
    const { consumerTimeSeriesService } = app.context.services;
    return consumerTimeSeriesService.processing(ctx.state.dto);
  };
}
