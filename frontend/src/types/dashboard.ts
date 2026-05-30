import type { Hackathon, StageConfig } from './hackathon';
import type { Registration } from './registration';
import type { Team } from './team';
import type { Submission } from './submission';
import type { Notification } from './api';

export type NextActionType =
  | 'BROWSE_HACKATHONS'
  | 'COMPLETE_PAYMENT'
  | 'AWAITING_APPROVAL'
  | 'FORM_TEAM'
  | 'JOIN_TEAM'
  | 'LOCK_TEAM'
  | 'SUBMIT_STAGE'
  | 'AWAITING_REVIEW'
  | 'START_NEXT_STAGE'
  | 'COMPLETED';

export interface NextAction {
  type: NextActionType;
  label: string;
  description: string;
  href?: string;
  stageName?: string;
  isUrgent?: boolean;
}

export interface DashboardData {
  registration: Registration | null;
  hackathon: Hackathon | null;
  team: Team | null;
  stages: StageConfig[];
  currentStage: StageConfig | null;
  submissions: Submission[];
  pendingInvitations: number;
  recentNotifications: Notification[];
  recentActivityLogs: Notification[];
  activityLogsLoading: boolean;
  activityLogsError: string | null;
  nextAction: NextAction;
  status: 'loading' | 'error' | 'empty' | 'success';
  error?: string;
}

export interface StageTimelineItem {
  order: number;
  name: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  isStage: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  type: 'submission' | 'stage_end' | 'registration' | 'payment';
  hackathonName: string;
  href?: string;
  isUrgent: boolean;
}
