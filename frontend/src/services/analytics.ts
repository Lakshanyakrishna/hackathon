import api from './api';
import type { AnalyticsFunnel } from '@/types/api';

export const analyticsService = {
  funnel: (hackathonId: string) =>
    api.get<AnalyticsFunnel>(`/hackathons/${hackathonId}/analytics/funnel`),
};
