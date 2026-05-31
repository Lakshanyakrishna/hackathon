import api from './api';
import type { Registration } from '@/types/registration';

export const registrationService = {
  my: () => api.get<Registration[]>('/registrations/my'),

  list: (params?: Record<string, string>) =>
    api.get<Registration[]>('/registrations', { params }),

  getById: (id: string) => api.get<Registration>(`/registrations/${id}`),

  create: (data: { hackathonId: string; teamId?: string }) =>
    api.post<Registration>('/registrations', data),

  approve: (id: string) => api.patch(`/registrations/${id}/approve`, { status: 'APPROVED' }),

  reject: (id: string) => api.patch(`/registrations/${id}/reject`, { status: 'REJECTED' }),

  cancel: (id: string) => api.delete(`/registrations/${id}`),

  stats: (hackathonId: string) => api.get(`/registrations/stats/${hackathonId}`),
};
