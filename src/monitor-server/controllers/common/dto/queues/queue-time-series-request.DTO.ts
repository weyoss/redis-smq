import { IsString } from 'class-validator';
import { TimeSeriesRequestDTO } from '../time-series/time-series-request.DTO';

export class QueueTimeSeriesRequestDTO extends TimeSeriesRequestDTO {
  @IsString()
  ns!: string;

  @IsString()
  queueName!: string;
}
