import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { ProblemStatementsController } from './problem-statements.controller';
import { ProblemStatementsService } from './problem-statements.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [ProblemStatementsController],
  providers: [ProblemStatementsService],
  exports: [ProblemStatementsService],
})
export class ProblemStatementsModule {}
