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
  ttl!: number;

  @IsInt()
  retryThreshold!: number;

  @IsInt()
  retryDelay!: number;

  @IsInt()
  consumeTimeout!: number;

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
  scheduledRepeatPeriod: number | null = null;

  @IsInt()
  scheduledRepeat!: number;

  @IsInt()
  @IsOptional()
  priority: number | null = null;

  @ValidateNested()
  @Type(() => MessageQueueDTO)
  queue: MessageQueueDTO | undefined | null;

  @ValidateNested()
  @Type(() => MessageMetadataDTO)
  metadata: MessageMetadataDTO | undefined | null;
}
