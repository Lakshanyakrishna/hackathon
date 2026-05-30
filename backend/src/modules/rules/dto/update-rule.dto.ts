import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRuleDto {
  @ApiPropertyOptional({ description: 'Rule title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
