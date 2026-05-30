import api from './api';
import type { Notification } from '@/types/api';
import type { PaginatedResponse } from '@/types/common';

export const notificationService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  unreadCount: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),
};
