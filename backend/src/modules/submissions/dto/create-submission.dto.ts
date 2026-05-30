import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Stage ID' })
  @IsString()
  stageId: string;

  @ApiPropertyOptional({
    description: 'Dynamic submission data. Keys must match stage requirements[].key',
    example: { pptUrl: 'https://slides.com/my-deck', ideaVideo: 'https://youtube.com/watch?v=abc' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Submission title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Submission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
