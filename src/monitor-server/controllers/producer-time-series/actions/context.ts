import { TRequestContext } from '../../../types/common';
import { QueueTimeSeriesRequestDTO } from '../../queue-time-series/common/queue-time-series-request.DTO';
import { ConsumerTimeSeriesRequestDTO } from '../../consumer-time-series/common/consumer-time-series-request.DTO';
import { ProducerTimeSeriesRequestDTO } from '../common/producer-time-series-request.DTO';
import { TimeSeriesRequestDTO } from '../../common/time-series/time-series-request.DTO';

export type TTimeSeriesRequestContext = TRequestContext<TimeSeriesRequestDTO>;

export type TQueueTimeSeriesRequestContext =
  TRequestContext<QueueTimeSeriesRequestDTO>;

export type TConsumerTimeSeriesRequestContext =
  TRequestContext<ConsumerTimeSeriesRequestDTO>;

export type TProducerTimeSeriesRequestContext =
  TRequestContext<ProducerTimeSeriesRequestDTO>;
