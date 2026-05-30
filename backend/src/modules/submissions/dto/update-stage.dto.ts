import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';

export class UpdateStageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  requirements?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  evaluationCriteria?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  promotionRule?: any;

  @ApiPropertyOptional({
    description: 'Override config freeze when submissions exist (organizer/admin only)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
