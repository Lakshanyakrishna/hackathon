import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRuleDto {
  @ApiProperty({ description: 'Rule title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Display order (auto-incremented if omitted)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
