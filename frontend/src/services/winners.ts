import api from './api';
import type { Winner } from '@/types/winner';

export const winnerService = {
  list: (hackathonId: string) => api.get<Winner[]>(`/hackathons/${hackathonId}/winners`),

  create: (hackathonId: string, data: { teamId: string; awardTitle: string; prizeId?: string }) =>
    api.post<Winner>(`/hackathons/${hackathonId}/winners`, data),

  remove: (hackathonId: string, id: string) =>
    api.delete(`/hackathons/${hackathonId}/winners/${id}`),
};
