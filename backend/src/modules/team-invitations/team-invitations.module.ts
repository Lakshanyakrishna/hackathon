import { Module } from '@nestjs/common';
import { TeamInvitationsController } from './team-invitations.controller';
import { TeamInvitationsService } from './team-invitations.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [TeamInvitationsController],
  providers: [TeamInvitationsService],
  exports: [TeamInvitationsService],
})
export class TeamInvitationsModule {}
