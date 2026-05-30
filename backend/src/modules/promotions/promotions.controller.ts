import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PromotionsService } from './promotions.service';
import { PromoteDto } from './dto/promote.dto';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('hackathons/:hackathonId/stages/:stageId/promote')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Evaluate promotion rule and promote teams to next stage' })
  promote(
    @Param('hackathonId') hackathonId: string,
    @Param('stageId') stageId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: PromoteDto,
  ) {
    return this.promotionsService.promote(hackathonId, stageId, userId, dto.teamIds, dto.force);
  }

  @Get('hackathons/:hackathonId/leaderboard')
  @ApiOperation({ summary: 'Get overall leaderboard across all stages (normalized)' })
  getOverallLeaderboard(
    @Param('hackathonId') hackathonId: string,
  ) {
    return this.promotionsService.getOverallLeaderboard(hackathonId);
  }

  @Get('hackathons/:hackathonId/stages/:stageId/leaderboard')
  @ApiOperation({ summary: 'Get leaderboard for a specific stage (normalized)' })
  getStageLeaderboard(
    @Param('hackathonId') hackathonId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.promotionsService.getStageLeaderboard(stageId, hackathonId);
  }
}
