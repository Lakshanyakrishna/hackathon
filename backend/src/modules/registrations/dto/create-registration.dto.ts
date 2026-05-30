import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({ example: 'uuid-of-hackathon' })
  @IsUUID()
  hackathonId: string;

  @ApiPropertyOptional({ example: 'uuid-of-team' })
  @IsOptional()
  @IsUUID()
  teamId?: string;
}
