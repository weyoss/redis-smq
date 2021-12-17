import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetQueuesResponseBodyQueueDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ns!: string;
}

export class GetQueuesResponseBodyDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetQueuesResponseBodyQueueDTO)
  data!: GetQueuesResponseBodyQueueDTO[];
}

export class GetQueuesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetQueuesResponseBodyDTO)
  body!: GetQueuesResponseBodyDTO;
}
