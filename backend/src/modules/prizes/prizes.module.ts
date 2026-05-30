import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { PrizesController } from './prizes.controller';
import { PrizesService } from './prizes.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [PrizesController],
  providers: [PrizesService],
  exports: [PrizesService],
})
export class PrizesModule {}
