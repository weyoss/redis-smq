import {
  Allow,
  Equals,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EMessagesPriority } from '../../../../../../types';

export class MessageDTO {
  @IsUUID('4')
  uuid!: string;

  @IsInt()
  attempts!: number;

  @IsInt()
  createdAt!: number;

  @IsInt()
  @IsOptional()
  ttl: number | null = null;

  @IsInt()
  @IsOptional()
  retryThreshold: number | null = null;

  @IsInt()
  @IsOptional()
  retryDelay: number | null = null;

  @IsInt()
  @IsOptional()
  consumeTimeout: number | null = null;

  @Allow()
  body: unknown = null;

  @IsString()
  @IsOptional()
  scheduledCron: string | null = null;

  @IsBoolean()
  scheduledCronFired!: boolean;

  @IsInt()
  @IsOptional()
  scheduledDelay: number | null = null;

  @IsInt()
  @IsOptional()
  scheduledPeriod: number | null = null;

  @IsInt()
  scheduledRepeat!: number;

  @IsInt()
  scheduledRepeatCount!: number;

  @IsBoolean()
  delayed!: boolean;

  @IsEnum(EMessagesPriority)
  @IsOptional()
  priority: EMessagesPriority | null = null;
}

export class GetScheduledMessagesResponseBodyDataDTO {
  @IsInt()
  total!: number;

  @ValidateNested()
  @Type(() => MessageDTO)
  items!: MessageDTO[];
}

export class GetScheduledMessagesResponseBodyDTO {
  @ValidateNested()
  @Type(() => GetScheduledMessagesResponseBodyDataDTO)
  data!: GetScheduledMessagesResponseBodyDataDTO;
}

export class GetScheduledMessagesResponseDTO {
  @IsInt()
  @Equals(200)
  status!: number;

  @ValidateNested()
  @Type(() => GetScheduledMessagesResponseBodyDTO)
  body!: GetScheduledMessagesResponseBodyDTO;
}
