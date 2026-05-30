import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HackathonsModule } from './modules/hackathons/hackathons.module';
import { TeamsModule } from './modules/teams/teams.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { ScoresModule } from './modules/scores/scores.module';
import { RulesModule } from './modules/rules/rules.module';
import { PrizesModule } from './modules/prizes/prizes.module';
import { ProblemStatementsModule } from './modules/problem-statements/problem-statements.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { TeamInvitationsModule } from './modules/team-invitations/team-invitations.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { WinnersModule } from './modules/winners/winners.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    HackathonsModule,
    TeamsModule,
    RegistrationsModule,
    PaymentsModule,
    SubmissionsModule,
    ScoresModule,
    RulesModule,
    PrizesModule,
    ProblemStatementsModule,
    AnnouncementsModule,
    DashboardModule,
    SettingsModule,
    UploadModule,
    NotificationsModule,
    ActivityLogsModule,
    TeamInvitationsModule,
    PromotionsModule,
    WinnersModule,
    AnalyticsModule,
    HealthModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
