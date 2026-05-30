import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { API_BASE } from '@/utils/constants';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = res.data;
        useAuthStore.getState().setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
