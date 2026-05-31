import api from './api';
import type { User } from '@/types/user';

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),

  signup: (data: SignupDto) => api.post<AuthResponse>('/auth/signup', data),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken?: string) => api.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {}, refreshToken ? { headers: { Authorization: `Bearer ${refreshToken}` } } : undefined),

  me: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
