import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';

export class CreateStageDto {
  @ApiProperty({ description: 'Stage name (e.g. "Idea Stage")' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Display order (1-based)' })
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Required fields for this stage',
    example: [
      { key: 'pptUrl', label: 'Idea PPT', type: 'url', required: true },
      { key: 'ideaVideo', label: 'Idea Video', type: 'url', required: true },
    ],
  })
  @IsOptional()
  @IsObject()
  requirements?: any;

  @ApiPropertyOptional({
    description: 'Judge scoring dimensions',
    example: [
      { name: 'Innovation', description: 'How innovative is the idea?', maxScore: 25, weight: 1.0 },
      { name: 'Technical', description: 'Technical depth', maxScore: 25, weight: 1.0 },
    ],
  })
  @IsOptional()
  @IsObject()
  evaluationCriteria?: any;

  @ApiPropertyOptional({
    description: 'Promotion rule to next stage',
    example: { type: 'all' },
  })
  @IsOptional()
  @IsObject()
  promotionRule?: any;
}
