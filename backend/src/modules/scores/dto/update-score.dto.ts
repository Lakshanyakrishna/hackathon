import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsObject, Min } from 'class-validator';

export class UpdateScoreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  criteriaScores?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  comment?: string;
}
