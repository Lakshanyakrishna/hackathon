import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { router } from './routes';
import { ToastContainer } from './components/ui/toast';
import { useAuthStore } from './stores/auth-store';
import { authService } from './services/auth';
import { API_BASE } from '@/utils/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const init = async () => {
      const store = useAuthStore.getState();
      if (!store.accessToken) {
        store.setLoading(false);
        return;
      }
      try {
        const res = await authService.me();
        store.setUser(res.data);
      } catch {
        try {
          const rt = store.refreshToken;
          if (!rt) throw new Error('No refresh token');
          const ref = await axios.post(`${API_BASE}/auth/refresh`, {}, { headers: { Authorization: `Bearer ${rt}` } });
          store.setAccessToken(ref.data.accessToken);
          if (ref.data.refreshToken) store.setRefreshToken(ref.data.refreshToken);
          const me = await authService.me();
          store.setUser(me.data);
        } catch {
          store.logout();
        }
      }
      store.setLoading(false);
    };
    init();
  }, []);
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
      <ToastContainer />
    </QueryClientProvider>
  );
}
