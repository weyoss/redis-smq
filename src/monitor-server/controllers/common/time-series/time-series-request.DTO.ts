import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class TimeSeriesRequestDTO {
  @IsInt()
  @Type(() => Number)
  from!: number;

  @IsInt()
  @Type(() => Number)
  to!: number;
}
