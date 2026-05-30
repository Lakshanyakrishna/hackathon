import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewRegistrationDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
