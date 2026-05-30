import api from './api';
import type { ActivityLog } from '@/types/api';
import type { PaginatedResponse } from '@/types/common';

export const activityLogService = {
  my: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<ActivityLog>>('/activity-logs/my', { params }),
};

export type { ActivityLog };
