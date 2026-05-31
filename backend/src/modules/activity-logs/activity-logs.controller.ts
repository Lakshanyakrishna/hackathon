import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ActivityLogsService } from './activity-logs.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('hackathon/:hackathonId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get activity logs for a hackathon' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findByHackathon(
    @Param('hackathonId') hackathonId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser('id') _userId: string,
  ) {
    return this.activityLogsService.findByHackathon(hackathonId, page, limit);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my activity logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findByUser(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.activityLogsService.findByUser(userId, page, limit);
  }

  @Get()
  @ApiOperation({ summary: 'Activity logs module status' })
  getStatus() {
    return this.activityLogsService.getStatus();
  }
}
