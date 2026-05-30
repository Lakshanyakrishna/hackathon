import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles('PARTICIPANT', 'ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new submission draft' })
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List submissions (role-filtered)' })
  @ApiQuery({ name: 'hackathonId', required: false })
  @ApiQuery({ name: 'stageId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query('hackathonId') hackathonId?: string,
    @Query('stageId') stageId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
  ) {
    return this.submissionsService.findAll(userId, userRole, {
      hackathonId,
      stageId,
      teamId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single submission by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.submissionsService.findOne(id, userId, userRole);
  }

  @Get(':id/preview')
  @ApiOperation({
    summary: 'Preview submission as judges will see it',
    description: 'Returns submission data merged with stage requirement definitions for frontend rendering',
  })
  preview(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.submissionsService.getPreview(id, userId, userRole);
  }

  @Put(':id')
  @Roles('PARTICIPANT', 'ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a draft submission' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.update(id, dto, userId);
  }

  @Post(':id/submit')
  @Roles('PARTICIPANT', 'ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Submit a draft submission for review' })
  submit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.submit(id, userId);
  }

  @Post(':id/resubmit')
  @Roles('PARTICIPANT', 'ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new version from a submitted submission' })
  resubmit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.resubmit(id, userId);
  }

  @Patch(':id/lock')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Lock a submission (organizer only)' })
  lock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.lock(id, userId);
  }

  @Patch(':id/reopen')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reopen a submission for editing (organizer only)' })
  reopen(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.reopen(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a submission' })
  getVersions(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.submissionsService.getVersions(id, userId, userRole);
  }
}
