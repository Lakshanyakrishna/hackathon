import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString } from 'class-validator';

export class UpdateSubmissionDto {
  @ApiPropertyOptional({
    description: 'Dynamic submission data. Keys must match stage requirements[].key',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
