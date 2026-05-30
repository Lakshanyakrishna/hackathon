import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateWinnerDto {
  @ApiProperty({ description: 'Team ID' })
  @IsString()
  teamId: string;

  @ApiProperty({ description: 'Award title (e.g. "Winner", "Best Innovation")' })
  @IsString()
  awardTitle: string;

  @ApiPropertyOptional({ description: 'Optional linked prize ID' })
  @IsOptional()
  @IsString()
  prizeId?: string;
}
