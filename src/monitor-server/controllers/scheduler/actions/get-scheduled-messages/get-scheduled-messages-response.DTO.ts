import {
  Allow,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}

export class GetScheduledMessagesResponseDTO {
  @IsInt()
  total!: number;

  @ValidateNested()
  @Type(() => MessageDTO)
  items!: MessageDTO[];
}
