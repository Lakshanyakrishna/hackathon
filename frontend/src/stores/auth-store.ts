import { create } from 'zustand';
import type { User } from '@/types/user';

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: load<User | null>('auth_user', null),
  accessToken: load<string | null>('auth_accessToken', null),
  refreshToken: load<string | null>('auth_refreshToken', null),
  isAuthenticated: !!load<string | null>('auth_accessToken', null),
  isLoading: true,
  setUser: (user) => { save('auth_user', user); set({ user, isAuthenticated: !!user }); },
  setAccessToken: (accessToken) => { save('auth_accessToken', accessToken); set({ accessToken }); },
  setRefreshToken: (refreshToken) => { save('auth_refreshToken', refreshToken); set({ refreshToken }); },
  login: (user, accessToken, refreshToken) => {
    save('auth_user', user);
    save('auth_accessToken', accessToken);
    save('auth_refreshToken', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    save('auth_user', null);
    save('auth_accessToken', null);
    save('auth_refreshToken', null);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
