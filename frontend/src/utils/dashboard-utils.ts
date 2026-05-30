import type { Registration } from '@/types/registration';
import type { Team } from '@/types/team';
import type { StageConfig } from '@/types/hackathon';
import type { NextAction, StageTimelineItem } from '@/types/dashboard';

export function deriveCurrentStage(team: Team | null, stages: StageConfig[]): StageConfig | null {
  if (!team || stages.length === 0) return null;
  const promoted = team.promotedToStageOrder;
  if (promoted <= 0) return null;
  return stages.find((s) => s.order === promoted) ?? null;
}

export function deriveNextAction(
  registration: Registration | null,
  team: Team | null,
  currentStage: StageConfig | null,
  stages: StageConfig[],
): NextAction {
  if (!registration) {
    return { type: 'BROWSE_HACKATHONS', label: 'Browse Hackathons', description: 'Find a hackathon to join', href: '/hackathons' };
  }

  if (registration.status === 'PENDING_PAYMENT') {
    return { type: 'COMPLETE_PAYMENT', label: 'Complete Payment', description: 'Finish registration payment to secure your spot', href: '#', isUrgent: true };
  }

  if (registration.status === 'PENDING_APPROVAL') {
    return { type: 'AWAITING_APPROVAL', label: 'Awaiting Approval', description: 'Your registration is under review by the organizer' };
  }

  if (registration.status === 'REJECTED' || registration.status === 'CANCELLED') {
    return { type: 'BROWSE_HACKATHONS', label: 'Browse Hackathons', description: 'Find another hackathon to join', href: '/hackathons' };
  }

  if (registration.status === 'APPROVED') {
    if (!team) {
      return { type: 'FORM_TEAM', label: 'Form a Team', description: 'Create or join a team to participate', href: `/hackathons/${registration.hackathon?.slug}/register`, isUrgent: true };
    }

    if (team.status === 'ACTIVE') {
      if (!currentStage && stages.length > 0) {
        return { type: 'AWAITING_REVIEW', label: 'Awaiting Promotion', description: 'Waiting for the organizer to promote your team to the first stage' };
      }

      if (currentStage) {
        if (currentStage.endDate && new Date(currentStage.endDate) < new Date()) {
          return { type: 'SUBMIT_STAGE', label: `Submit ${currentStage.name}`, description: 'Stage deadline has passed — submit your work', href: '#', isUrgent: true, stageName: currentStage.name };
        }
        return { type: 'SUBMIT_STAGE', label: `Submit ${currentStage.name}`, description: `Submit your work for ${currentStage.name}`, href: '#', stageName: currentStage.name };
      }
    }

    if (team.status === 'LOCKED') {
      if (!currentStage && stages.length > 0) {
        return { type: 'AWAITING_REVIEW', label: 'Awaiting Promotion', description: 'Team locked — waiting for stage assignment' };
      }
      if (currentStage) {
        return { type: 'SUBMIT_STAGE', label: `Submit ${currentStage.name}`, description: `Submit your work for ${currentStage.name}`, href: '#', stageName: currentStage.name };
      }
    }

    if (team.status === 'DISQUALIFIED') {
      return { type: 'BROWSE_HACKATHONS', label: 'Browse Hackathons', description: 'Your team was disqualified. Find another hackathon.', href: '/hackathons' };
    }
  }

  return { type: 'BROWSE_HACKATHONS', label: 'Browse Hackathons', description: 'Explore available hackathons', href: '/hackathons' };
}

export function buildStageTimeline(
  team: Team | null,
  stages: StageConfig[],
): StageTimelineItem[] {
  const promoted = team?.promotedToStageOrder ?? 0;
  const items: StageTimelineItem[] = [];

  items.push({
    order: 0,
    name: 'Registration',
    status: team ? 'completed' : 'current',
    isStage: false,
  });

  if (team && team.status === 'DISQUALIFIED') {
    items.push({
      order: -1,
      name: 'Disqualified',
      status: 'locked',
      isStage: false,
    });
    return items;
  }

  for (const stage of stages) {
    let status: StageTimelineItem['status'] = 'upcoming';
    if (stage.order < promoted) {
      status = 'completed';
    } else if (stage.order === promoted) {
      status = 'current';
    } else {
      status = 'upcoming';
    }
    if (!team) {
      status = 'locked';
    }
    items.push({
      order: stage.order,
      name: stage.name,
      status,
      isStage: true,
      startDate: stage.startDate ?? undefined,
      endDate: stage.endDate ?? undefined,
    });
  }

  return items;
}

export function timeUntil(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Overdue';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins}m`;
}

export function isUrgent(dateStr: string): boolean {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24 && diffHours > 0;
}
