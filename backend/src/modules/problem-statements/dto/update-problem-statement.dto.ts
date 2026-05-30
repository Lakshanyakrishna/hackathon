import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class UpdateProblemStatementDto {
  @ApiPropertyOptional({ description: 'Problem statement title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Problem statement description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Difficulty })
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

  @ApiPropertyOptional({ description: 'Whether the problem statement is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
