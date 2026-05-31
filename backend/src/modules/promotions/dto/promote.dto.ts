import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsBoolean, ArrayMinSize } from 'class-validator';

export class PromoteDto {
  @ApiPropertyOptional({ description: 'Required for MANUAL_SELECTION; list of team IDs to promote' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  teamIds?: string[];

  @ApiPropertyOptional({ description: 'Force re-run even if promotion already executed' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
