import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsNumber } from 'class-validator';

export class CreatePrizeDto {
  @ApiPropertyOptional({ description: 'Prize position (auto-incremented if omitted)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @ApiPropertyOptional({ description: 'Prize title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Prize amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Prize description' })
  @IsOptional()
  @IsString()
  description?: string;
}
