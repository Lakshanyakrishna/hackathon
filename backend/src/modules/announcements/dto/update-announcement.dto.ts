import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ description: 'Announcement title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Announcement content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Whether the announcement is pinned' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Whether the announcement is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Scheduled publish date' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
