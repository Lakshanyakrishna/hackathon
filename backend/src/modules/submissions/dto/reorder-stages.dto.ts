import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';

export class ReorderStagesDto {
  @ApiProperty({ description: 'Stage IDs in desired display order' })
  @IsArray()
  @IsString({ each: true })
  stageIds: string[];

  @ApiPropertyOptional({
    description: 'Override safety check when submissions exist',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
