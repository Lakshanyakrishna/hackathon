import api from './api';
import type { Hackathon, StageConfig, Rule, Prize, ProblemStatement, Announcement } from '@/types/hackathon';

export const hackathonService = {
  list: (params?: Record<string, string>) =>
    api.get<Hackathon[]>('/hackathons', { params }),

  getBySlug: (slug: string) =>
    api.get<Hackathon>(`/hackathons/slug/${slug}`),

  getById: (id: string) =>
    api.get<Hackathon>(`/hackathons/${id}`),

  create: (data: Partial<Hackathon>) =>
    api.post<Hackathon>('/hackathons', data),

  update: (id: string, data: Partial<Hackathon>) =>
    api.patch<Hackathon>(`/hackathons/${id}`, data),

  delete: (id: string) =>
    api.delete(`/hackathons/${id}`),

  publish: (id: string) =>
    api.patch(`/hackathons/${id}/publish`),

  archive: (id: string) =>
    api.patch(`/hackathons/${id}/archive`),

  stages: {
    list: (hackathonId: string) =>
      api.get<StageConfig[]>(`/hackathons/${hackathonId}/stages`),

    get: (hackathonId: string, id: string) =>
      api.get<StageConfig>(`/hackathons/${hackathonId}/stages/${id}`),

    create: (hackathonId: string, data: Partial<StageConfig>) =>
      api.post<StageConfig>(`/hackathons/${hackathonId}/stages`, data),

    update: (hackathonId: string, id: string, data: Partial<StageConfig>) =>
      api.patch<StageConfig>(`/hackathons/${hackathonId}/stages/${id}`, data),

    delete: (hackathonId: string, id: string) =>
      api.delete(`/hackathons/${hackathonId}/stages/${id}`),

    reorder: (hackathonId: string, data: { stageIds: string[]; force?: boolean }) =>
      api.put(`/hackathons/${hackathonId}/stages/reorder`, data),
  },

  rules: {
    list: (hackathonId: string) =>
      api.get<Rule[]>(`/hackathons/${hackathonId}/rules`),

    create: (hackathonId: string, data: Partial<Rule>) =>
      api.post<Rule>(`/hackathons/${hackathonId}/rules`, data),

    update: (hackathonId: string, id: string, data: Partial<Rule>) =>
      api.patch<Rule>(`/hackathons/${hackathonId}/rules/${id}`, data),

    delete: (hackathonId: string, id: string) =>
      api.delete(`/hackathons/${hackathonId}/rules/${id}`),
  },

  prizes: {
    list: (hackathonId: string) =>
      api.get<Prize[]>(`/hackathons/${hackathonId}/prizes`),

    create: (hackathonId: string, data: Partial<Prize>) =>
      api.post<Prize>(`/hackathons/${hackathonId}/prizes`, data),

    update: (hackathonId: string, id: string, data: Partial<Prize>) =>
      api.patch<Prize>(`/hackathons/${hackathonId}/prizes/${id}`, data),

    delete: (hackathonId: string, id: string) =>
      api.delete(`/hackathons/${hackathonId}/prizes/${id}`),
  },

  problemStatements: {
    list: (hackathonId: string) =>
      api.get<ProblemStatement[]>(`/hackathons/${hackathonId}/problem-statements`),

    create: (hackathonId: string, data: Partial<ProblemStatement>) =>
      api.post<ProblemStatement>(`/hackathons/${hackathonId}/problem-statements`, data),

    update: (hackathonId: string, id: string, data: Partial<ProblemStatement>) =>
      api.patch<ProblemStatement>(`/hackathons/${hackathonId}/problem-statements/${id}`, data),

    delete: (hackathonId: string, id: string) =>
      api.delete(`/hackathons/${hackathonId}/problem-statements/${id}`),
  },

  announcements: {
    list: (hackathonId: string) =>
      api.get<Announcement[]>(`/hackathons/${hackathonId}/announcements`),

    create: (hackathonId: string, data: Partial<Announcement>) =>
      api.post<Announcement>(`/hackathons/${hackathonId}/announcements`, data),

    update: (hackathonId: string, id: string, data: Partial<Announcement>) =>
      api.patch<Announcement>(`/hackathons/${hackathonId}/announcements/${id}`, data),

    delete: (hackathonId: string, id: string) =>
      api.delete(`/hackathons/${hackathonId}/announcements/${id}`),
  },
};
