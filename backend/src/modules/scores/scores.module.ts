import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
