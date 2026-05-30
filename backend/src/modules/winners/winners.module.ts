import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { WinnersController } from './winners.controller';
import { WinnersService } from './winners.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [WinnersController],
  providers: [WinnersService],
  exports: [WinnersService],
})
export class WinnersModule {}
