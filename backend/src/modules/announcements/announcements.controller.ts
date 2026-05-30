import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hackathons/:hackathonId/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all announcements for a hackathon' })
  findAll(@Param('hackathonId') hackathonId: string) {
    return this.announcementsService.findAll(hackathonId);
  }

  @Post()
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create an announcement (organizer/admin)' })
  create(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.announcementsService.create(hackathonId, dto, userId);
  }

  @Patch(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update an announcement (organizer/admin)' })
  update(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.announcementsService.update(hackathonId, id, dto, userId);
  }

  @Delete(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete an announcement (organizer/admin)' })
  remove(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.announcementsService.remove(hackathonId, id, userId);
  }
}
