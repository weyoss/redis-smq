import {
  Allow,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MessageQueueDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ns!: string;
}

export class MessageMetadataDTO {
  @IsUUID('4')
  uuid!: string;

  @IsInt()
  @IsOptional()
  publishedAt: number | null = null;

  @IsInt()
  @IsOptional()
  scheduledAt: number | null = null;

  @IsBoolean()
  scheduledCronFired!: boolean;

  @IsInt()
  scheduledRepeatCount!: number;

  @IsInt()
  attempts!: number;

  @IsInt()
  nextScheduledDelay!: number;

  @IsInt()
  nextRetryDelay!: number;

  @IsBoolean()
  expired!: boolean;
}

export class MessageDTO {
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

  @IsInt()
  @IsOptional()
  scheduledDelay: number | null = null;

  @IsInt()
  @IsOptional()
  scheduledPeriod: number | null = null;

  @IsInt()
  scheduledRepeat!: number;

  @IsInt()
  @IsOptional()
  priority: number | null = null;

  @ValidateNested()
  @Type(() => MessageQueueDTO)
  queue!: MessageQueueDTO;

  @ValidateNested()
  @Type(() => MessageMetadataDTO)
  metadata!: MessageMetadataDTO;
}
