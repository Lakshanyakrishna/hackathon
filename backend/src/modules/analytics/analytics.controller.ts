import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hackathons/:hackathonId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('funnel')
  @ApiOperation({ summary: 'Get funnel metrics: Registration → Paid → Approved → Submitted' })
  getFunnel(@Param('hackathonId') hackathonId: string) {
    return this.analyticsService.getFunnel(hackathonId);
  }
}
