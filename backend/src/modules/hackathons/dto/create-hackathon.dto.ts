import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HackathonMode, RegistrationMode } from '@prisma/client';

export class StageConfigDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateHackathonDto {
  @ApiProperty({ example: 'AI Hackathon 2026' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Build the future with AI' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFee?: number;

  @ApiProperty()
  @IsDateString()
  registrationDeadline: string;

  @ApiPropertyOptional({ enum: RegistrationMode, default: 'OPEN' })
  @IsOptional()
  @IsEnum(RegistrationMode)
  registrationMode?: RegistrationMode;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minTeamSize?: number;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxTeamSize?: number;

  @ApiPropertyOptional({ enum: HackathonMode, default: 'ONLINE' })
  @IsOptional()
  @IsEnum(HackathonMode)
  mode?: HackathonMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional({ type: [StageConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageConfigDto)
  stages?: StageConfigDto[];
}
