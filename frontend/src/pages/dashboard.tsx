import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/use-dashboard';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { NextActionCard } from '@/components/dashboard/next-action-card';
import { CurrentStageCard } from '@/components/dashboard/current-stage-card';
import { StageTimeline } from '@/components/dashboard/stage-timeline';
import { HackathonJourneyCard } from '@/components/dashboard/hackathon-journey-card';
import { RequirementsProgressCard } from '@/components/dashboard/requirements-progress-card';
import { TeamCard } from '@/components/dashboard/team-card';
import { NotificationsPanel } from '@/components/dashboard/notifications-panel';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { buildStageTimeline } from '@/utils/dashboard-utils';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardData } from '@/types/dashboard';

function DashboardContent(data: DashboardData) {
  const user = useAuthStore((s) => s.user);
  const {
    registration,
    hackathon,
    team,
    stages,
    currentStage,
    submissions,
    pendingInvitations,
    recentNotifications,
    recentActivityLogs,
    activityLogsLoading,
    activityLogsError,
    nextAction,
  } = data;

  const timelineItems = buildStageTimeline(team, stages);
  const maxTeamSize = hackathon?.maxTeamSize ?? 10;

  return (
    <div className="space-y-6">
      <WelcomeHeader
        name={user?.name ?? 'User'}
        hackathon={hackathon}
        team={team}
        registration={registration}
      />

      <HackathonJourneyCard
        hackathon={hackathon}
        registration={registration}
        team={team}
        stages={stages}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <NextActionCard action={nextAction} />

          {hackathon && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-5">
                <StageTimeline items={timelineItems} />
              </Card>
            </motion.div>
          )}

          <CurrentStageCard
            stage={currentStage}
            team={team}
            submissions={submissions}
          />

          <RequirementsProgressCard
            stage={currentStage}
            team={team}
            submissions={submissions}
          />

          <UpcomingDeadlines stages={stages} registration={registration} />

          <RecentActivity
            logs={recentActivityLogs}
            isLoading={activityLogsLoading}
            error={activityLogsError}
            onRetry={() => {}}
          />
        </div>

        <div className="space-y-6">
          <TeamCard team={team} maxTeamSize={maxTeamSize} />

          <NotificationsPanel
            notifications={recentNotifications}
            pendingInvitations={pendingInvitations}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const data = useDashboard();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  if (data.status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (data.status === 'error') {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={data.error ?? 'Something went wrong'}
        onRetry={() => queryClient.invalidateQueries()}
      />
    );
  }

  if (data.status === 'empty') {
    return (
      <div className="space-y-6">
        <WelcomeHeader
          name={user?.name ?? 'User'}
          hackathon={null}
          team={null}
          registration={null}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NextActionCard action={data.nextAction} />
          </div>
          <div>
            <NotificationsPanel notifications={data.recentNotifications} pendingInvitations={data.pendingInvitations} />
          </div>
        </div>
        <EmptyState
          title="No hackathon registrations"
          description="Find a hackathon that excites you and join the competition."
          action={{
            label: 'Browse Hackathons',
            onClick: () => navigate('/hackathons'),
          }}
        />
      </div>
    );
  }

  return <DashboardContent {...data} />;
}
