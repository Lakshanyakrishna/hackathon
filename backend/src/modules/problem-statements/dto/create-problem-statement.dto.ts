import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateProblemStatementDto {
  @ApiProperty({ description: 'Problem statement title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Problem statement description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: Difficulty, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ description: 'Technologies/tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ description: 'Reference resources', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];
}
