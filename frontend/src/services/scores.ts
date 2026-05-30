import api from './api';
import type { Score } from '@/types/score';

export const scoreService = {
  list: (params?: Record<string, string>) =>
    api.get<Score[]>('/scores', { params }),

  getById: (id: string) => api.get<Score>(`/scores/${id}`),

  getStageScores: (stageId: string) => api.get<Score[]>(`/scores/stage/${stageId}`),

  create: (data: { teamId: string; stageId?: string; criteriaScores: Record<string, number>; total: number; comment?: string }) =>
    api.post<Score>('/scores', data),

  update: (id: string, data: { criteriaScores?: Record<string, number>; total?: number; comment?: string }) =>
    api.put<Score>(`/scores/${id}`, data),
};
