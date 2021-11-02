import {
  Allow,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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

  @IsInt()
  @IsOptional()
  priority: number | null = null;

  @IsBoolean()
  expired!: boolean;

  @IsString()
  queueName!: string;
}