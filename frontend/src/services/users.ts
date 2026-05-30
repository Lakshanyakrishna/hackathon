import api from './api';
import type { User } from '@/types/user';

export const userService = {
  list: (params?: Record<string, string>) =>
    api.get<User[]>('/users', { params }),

  getById: (id: string) => api.get<User>(`/users/${id}`),

  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),
};
