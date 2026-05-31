import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'hackathonId', required: false })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('hackathonId') hackathonId?: string,
  ) {
    return this.teamsService.findAll(pagination, hackathonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async findById(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Get('my/teams')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my teams' })
  async findMyTeams(@CurrentUser('id') userId: string) {
    return this.teamsService.findMyTeams(userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PARTICIPANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a team (participant only)' })
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team (owner only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.update(id, dto, userId);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a team (participant)' })
  async join(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.join(id, userId);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a team (member)' })
  async leave(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.leave(id, userId);
  }

  @Patch(':id/lock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle team lock (admin)' })
  async lock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.lock(id, userId);
  }

  @Patch(':id/disqualify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle team disqualification (admin)' })
  async disqualify(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.disqualify(id, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete team (owner/organizer/admin)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.remove(id, userId);
  }
}
