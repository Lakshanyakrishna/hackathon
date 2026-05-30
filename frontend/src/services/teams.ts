import api from './api';
import type { Team, TeamInvitation } from '@/types/team';

export const teamService = {
  list: () => api.get<Team[]>('/teams'),

  getById: (id: string) => api.get<Team>(`/teams/${id}`),

  getMyTeams: () => api.get<Team[]>('/teams/my/teams'),

  create: (data: { hackathonId: string; name: string }) =>
    api.post<Team>('/teams', data),

  update: (id: string, data: { name?: string }) =>
    api.patch<Team>(`/teams/${id}`, data),

  join: (id: string) => api.post(`/teams/${id}/join`),

  leave: (id: string) => api.post(`/teams/${id}/leave`),

  lock: (id: string) => api.patch(`/teams/${id}/lock`),

  disqualify: (id: string) => api.patch(`/teams/${id}/disqualify`),

  delete: (id: string) => api.delete(`/teams/${id}`),

  invitations: {
    send: (data: { teamId: string; email?: string; username?: string }) =>
      api.post<TeamInvitation>('/team-invitations', data),

    accept: (id: string) => api.post(`/team-invitations/${id}/accept`),

    reject: (id: string) => api.post(`/team-invitations/${id}/reject`),

    cancel: (id: string) => api.delete(`/team-invitations/${id}`),

    pending: () => api.get<TeamInvitation[]>('/team-invitations/pending'),

    teamPending: (teamId: string) =>
      api.get<TeamInvitation[]>(`/team-invitations/team/${teamId}`),
  },
};
