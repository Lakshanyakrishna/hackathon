import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@/services/registrations';
import { teamService } from '@/services/teams';
import { notificationService } from '@/services/notifications';
import { hackathonService } from '@/services/hackathons';
import { submissionService } from '@/services/submissions';
import { activityLogService } from '@/services/activity-logs';
import { deriveNextAction, deriveCurrentStage } from '@/utils/dashboard-utils';
import { unwrapData } from '@/utils/unwrap-data';
import type { DashboardData, NextAction } from '@/types/dashboard';
import type { Hackathon, StageConfig } from '@/types/hackathon';
import type { Registration } from '@/types/registration';
import type { Team, TeamInvitation } from '@/types/team';
import type { Submission } from '@/types/submission';
import type { Notification, ActivityLog } from '@/types/api';

export function useDashboard(): DashboardData {
  const registrationsQuery = useQuery({
    queryKey: ['dashboard-registrations'],
    queryFn: () => registrationService.my().then((r) => unwrapData<Registration[]>(r)),
    staleTime: 30_000,
    retry: 1,
  });

  const teamsQuery = useQuery({
    queryKey: ['dashboard-teams'],
    queryFn: () => teamService.getMyTeams().then((r) => unwrapData<Team[]>(r)),
    staleTime: 30_000,
    retry: 1,
  });

  const invitationsQuery = useQuery({
    queryKey: ['dashboard-invitations'],
    queryFn: () => teamService.invitations.pending().then((r) => unwrapData<TeamInvitation[]>(r)),
    staleTime: 30_000,
    retry: 1,
  });

  const notificationsQuery = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: () => notificationService.list({ limit: '10' }).then((r) => unwrapData<Notification[]>(r)),
    staleTime: 30_000,
    retry: 1,
  });

  const activityLogsQuery = useQuery({
    queryKey: ['dashboard-activity-logs'],
    queryFn: () => activityLogService.my({ limit: '10' }).then((r) => unwrapData<ActivityLog[]>(r)),
    staleTime: 30_000,
    retry: 1,
  });

  const registration = (registrationsQuery.data ?? [])[0] ?? null;
  const team = (teamsQuery.data ?? [])[0] ?? null;
  const pendingInvs = invitationsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const activityLogs = activityLogsQuery.data ?? [];

  const hackathonId = registration?.hackathon?.id ?? registration?.hackathonId ?? null;

  const hackathonQuery = useQuery({
    queryKey: ['dashboard-hackathon', hackathonId],
    queryFn: () => hackathonService.getById(hackathonId!).then((r) => unwrapData<Hackathon>(r)),
    enabled: !!hackathonId,
    staleTime: 60_000,
  });

  const stagesQuery = useQuery({
    queryKey: ['dashboard-stages', hackathonId],
    queryFn: () => hackathonService.stages.list(hackathonId!).then((r) => unwrapData<StageConfig[]>(r)),
    enabled: !!hackathonId,
    staleTime: 60_000,
  });

  const teamId = team?.id ?? null;

  const submissionsQuery = useQuery({
    queryKey: ['dashboard-submissions', teamId],
    queryFn: () =>
      submissionService.list(teamId ? { teamId } : undefined).then((r) => unwrapData<Submission[]>(r)),
    enabled: !!teamId,
    staleTime: 30_000,
  });

  const primaryLoading =
    registrationsQuery.isLoading ||
    teamsQuery.isLoading ||
    invitationsQuery.isLoading ||
    notificationsQuery.isLoading ||
    activityLogsQuery.isLoading;

  const primaryError =
    registrationsQuery.isError ||
    teamsQuery.isError ||
    invitationsQuery.isError ||
    notificationsQuery.isError ||
    activityLogsQuery.isError;

  const stagesLoading = stagesQuery.isLoading && stagesQuery.fetchStatus !== 'idle';
  const submissionsLoading = submissionsQuery.isLoading && submissionsQuery.fetchStatus !== 'idle';

  const isLoading = primaryLoading || (!!hackathonId && stagesLoading) || (!!teamId && submissionsLoading);

  if (isLoading) {
    return {
      registration: null,
      hackathon: null,
      team: null,
      stages: [],
      currentStage: null,
      submissions: [],
      pendingInvitations: 0,
      recentNotifications: [],
      recentActivityLogs: [],
      activityLogsLoading: false,
      activityLogsError: null,
      nextAction: { type: 'BROWSE_HACKATHONS', label: '', description: '' },
      status: 'loading',
    };
  }

  const isError = primaryError || stagesQuery.isError || submissionsQuery.isError;

  const errorMessages: string[] = [];
  if (registrationsQuery.error) errorMessages.push('Failed to load registrations');
  if (teamsQuery.error) errorMessages.push('Failed to load teams');
  if (stagesQuery.error) errorMessages.push('Failed to load stages');
  if (submissionsQuery.error) errorMessages.push('Failed to load submissions');

  if (isError) {
    return {
      registration: null,
      hackathon: null,
      team: null,
      stages: [],
      currentStage: null,
      submissions: [],
      pendingInvitations: 0,
      recentNotifications: [],
      recentActivityLogs: [],
      activityLogsLoading: false,
      activityLogsError: null,
      nextAction: { type: 'BROWSE_HACKATHONS', label: '', description: '' },
      status: 'error',
      error: errorMessages.join('; ') || 'Failed to load dashboard',
    };
  }

  if (!registration) {
    return {
      registration: null,
      hackathon: null,
      team: null,
      stages: [],
      currentStage: null,
      submissions: [],
      pendingInvitations: pendingInvs.length,
      recentNotifications: notifications.slice(0, 5),
      recentActivityLogs: activityLogs.slice(0, 5),
      activityLogsLoading: activityLogsQuery.isLoading,
      activityLogsError: activityLogsQuery.isError ? 'Failed to load activity' : null,
      nextAction: {
        type: 'BROWSE_HACKATHONS',
        label: 'Browse Hackathons',
        description: 'Find a hackathon to join',
        href: '/hackathons',
      },
      status: 'empty',
    };
  }

  const stagesSorted = [...(stagesQuery.data ?? [])].sort((a, b) => a.order - b.order);
  const submissions = (submissionsQuery.data ?? []) as Submission[];
  const currentStage = deriveCurrentStage(team, stagesSorted);
  const nextAction: NextAction = deriveNextAction(registration, team, currentStage, stagesSorted);

  return {
    registration,
    hackathon: hackathonQuery.data ?? null,
    team,
    stages: stagesSorted,
    currentStage,
    submissions,
    pendingInvitations: pendingInvs.length,
    recentNotifications: notifications.slice(0, 5),
    recentActivityLogs: activityLogs.slice(0, 5),
    activityLogsLoading: activityLogsQuery.isLoading,
    activityLogsError: activityLogsQuery.isError ? 'Failed to load activity' : null,
    nextAction,
    status: 'success',
  };
}
