import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';

export class CreateScoreDto {
  @ApiProperty({ description: 'Team ID to score' })
  @IsString()
  teamId: string;

  @ApiPropertyOptional({ description: 'Stage ID (if stage-specific scoring)' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiProperty({
    description: 'Dynamic scores keyed by evaluation criteria name',
    example: { Innovation: 22, Technical: 20, 'UI/UX': 18, Presentation: 15 },
  })
  @IsObject()
  criteriaScores: Record<string, number>;

  @ApiProperty({ description: 'Total score' })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
