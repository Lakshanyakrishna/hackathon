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
}

export const authService = {
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),

  signup: (data: SignupDto) => api.post<AuthResponse>('/auth/signup', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),

  me: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
