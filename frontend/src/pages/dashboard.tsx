import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutList, ArrowRight } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buildStageTimeline } from '@/utils/dashboard-utils';
import { useAuthStore } from '@/stores/auth-store';
import { CreateHackathonDialog } from '@/components/dashboard/create-hackathon-dialog';
import type { DashboardData } from '@/types/dashboard';

function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <CreateHackathonDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />

      <WelcomeHeader
        name={user?.name ?? 'Admin'}
        hackathon={null}
        team={null}
        registration={null}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                className="relative cursor-pointer overflow-hidden border-accent/20 bg-gradient-to-br from-accent/15 to-purple-500/5 transition-all hover:shadow-lg hover:border-accent/40 group"
                onClick={() => setShowCreateDialog(true)}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-[80px]" />
                </div>
                <CardContent className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-pink shadow-lg">
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Create Hackathon</h3>
                    <p className="mt-1 text-sm text-text-muted">Set up a new hackathon with prizes, rules, stages, and problem statements</p>
                  </div>
                  <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-pink hover:opacity-90 group-hover:shadow-md transition-all">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                className="relative cursor-pointer overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 to-purple-500/5 transition-all hover:shadow-lg hover:border-accent/40 group"
                onClick={() => navigate('/organize')}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-[80px]" />
                </div>
                <CardContent className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-accent shadow-lg">
                    <LayoutList className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Manage Hackathons</h3>
                    <p className="mt-1 text-sm text-text-muted">Edit existing hackathons, review submissions, and declare winners</p>
                  </div>
                  <Button size="sm" className="gap-1.5 bg-gradient-to-r from-purple-500 to-accent hover:opacity-90 group-hover:shadow-md transition-all">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        <div className="space-y-6">
          <NotificationsPanel
            notifications={[]}
            pendingInvitations={0}
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantDashboard(data: DashboardData) {
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

  if (user?.role === 'SUPER_ADMIN') {
    return <AdminDashboard />;
  }

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

  return <ParticipantDashboard {...data} />;
}
