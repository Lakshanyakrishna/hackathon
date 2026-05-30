import api from './api';
import type { Submission, SubmissionPreview } from '@/types/submission';

export const submissionService = {
  list: (params?: Record<string, string>) =>
    api.get<Submission[]>('/submissions', { params }),

  getById: (id: string) => api.get<Submission>(`/submissions/${id}`),

  preview: (id: string) => api.get<SubmissionPreview>(`/submissions/${id}/preview`),

  create: (data: { teamId: string; hackathonId: string; stageId: string; data?: Record<string, unknown> }) =>
    api.post<Submission>('/submissions', data),

  update: (id: string, data: { data?: Record<string, unknown>; title?: string; description?: string; notes?: string }) =>
    api.put<Submission>(`/submissions/${id}`, data),

  submit: (id: string) => api.post(`/submissions/${id}/submit`),

  resubmit: (id: string, data: { data: Record<string, unknown> }) =>
    api.post<Submission>(`/submissions/${id}/resubmit`, data),

  lock: (id: string) => api.patch(`/submissions/${id}/lock`),

  reopen: (id: string) => api.patch(`/submissions/${id}/reopen`),

  versions: (id: string) => api.get<Submission[]>(`/submissions/${id}/versions`),
};
