import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          useAuthStore.getState().setAccessToken(token);
          const res = await authService.me();
          login(res.data, token);
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    login(res.data.user, res.data.accessToken);
    navigate('/dashboard');
  };

  const handleSignup = async (data: { email: string; username: string; password: string; name: string }) => {
    const res = await authService.signup(data);
    localStorage.setItem('accessToken', res.data.accessToken);
    login(res.data.user, res.data.accessToken);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    logout();
    navigate('/');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };
}
