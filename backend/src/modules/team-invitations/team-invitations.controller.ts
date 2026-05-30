import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { TeamInvitationsService } from './team-invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Team Invitations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('team-invitations')
export class TeamInvitationsController {
  constructor(private readonly teamInvitationsService: TeamInvitationsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Send a team invitation (team owner only)' })
  async send(
    @Body() dto: CreateInvitationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamInvitationsService.send(dto, userId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a team invitation' })
  async accept(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamInvitationsService.accept(id, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a team invitation' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamInvitationsService.reject(id, userId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get my pending invitations' })
  async getPendingForUser(@CurrentUser('id') userId: string) {
    return this.teamInvitationsService.getPendingForUser(userId);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get pending invitations for a team (owner only)' })
  async getPendingForTeam(
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamInvitationsService.getPendingForTeam(teamId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending invitation (team owner only)' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamInvitationsService.cancel(id, userId);
  }
}
