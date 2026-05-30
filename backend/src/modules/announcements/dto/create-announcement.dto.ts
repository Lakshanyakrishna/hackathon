import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Announcement content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Whether the announcement is pinned' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Scheduled publish date' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
