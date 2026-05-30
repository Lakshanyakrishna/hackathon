export interface AnalyticsFunnel {
  hackathonId: string;
  hackathonTitle: string;
  funnel: FunnelStage[];
  summary: FunnelSummary;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface FunnelSummary {
  totalRegistrations: number;
  paidRegistrations: number;
  approvedRegistrations: number;
  teamsWithApproved: number;
  stagesCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  hackathonId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name: string };
}
