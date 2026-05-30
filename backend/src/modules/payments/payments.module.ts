import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { PaymentsService } from './payments.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ActivityLogsModule, NotificationsModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
