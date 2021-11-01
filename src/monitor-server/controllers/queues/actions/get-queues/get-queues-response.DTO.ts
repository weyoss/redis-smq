import { IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetQueuesResponseBodyDTO {
  @IsString({ each: true })
  data!: string[];
}

export class GetQueuesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetQueuesResponseBodyDTO)
  body!: GetQueuesResponseBodyDTO;
}
