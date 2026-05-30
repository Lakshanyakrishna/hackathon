import api from './api';
import type { LeaderboardEntry, OverallLeaderboardEntry } from '@/types/score';

export const promotionService = {
  promote: (hackathonId: string, stageId: string, data?: { teamIds?: string[]; force?: boolean }) =>
    api.post(`/hackathons/${hackathonId}/stages/${stageId}/promote`, data || {}),

  stageLeaderboard: (hackathonId: string, stageId: string) =>
    api.get<LeaderboardEntry[]>(`/hackathons/${hackathonId}/stages/${stageId}/leaderboard`),

  overallLeaderboard: (hackathonId: string) =>
    api.get<OverallLeaderboardEntry[]>(`/hackathons/${hackathonId}/leaderboard`),
};
