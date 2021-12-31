import { TApplication } from '../../../../types/common';
import { TMultiQueueProducerTimeSeriesRequestContext } from '../context';

export function PublishedHandler(app: TApplication) {
  return async (ctx: TMultiQueueProducerTimeSeriesRequestContext) => {
    const { multiQueueProducerTimeSeriesService } = app.context.services;
    return multiQueueProducerTimeSeriesService.published(ctx.state.dto);
  };
}
