import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule, NotificationsModule],
  controllers: [SubmissionsController, StagesController],
  providers: [SubmissionsService, StagesService],
  exports: [SubmissionsService, StagesService],
})
export class SubmissionsModule {}
