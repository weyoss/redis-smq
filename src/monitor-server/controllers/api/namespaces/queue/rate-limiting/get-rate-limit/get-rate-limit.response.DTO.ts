import { IsInt, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRateLimitResponseBodyDataDTO {
  @IsNumber()
  @Type(() => Number)
  interval!: number;

  @IsNumber()
  @Type(() => Number)
  limit!: number;
}

export class GetRateLimitResponseBodyDTO {
  @ValidateNested()
  @Type(() => GetRateLimitResponseBodyDataDTO)
  @IsOptional()
  data?: GetRateLimitResponseBodyDataDTO | null = null;
}

export class GetRateLimitResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetRateLimitResponseBodyDTO)
  body!: GetRateLimitResponseBodyDTO;
}
