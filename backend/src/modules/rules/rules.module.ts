import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
