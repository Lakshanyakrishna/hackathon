import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { ToastContainer } from './components/ui/toast';
import { useAuthStore } from './stores/auth-store';
import { authService } from './services/auth';

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
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          useAuthStore.getState().setAccessToken(token);
          const res = await authService.me();
          useAuthStore.getState().login(res.data, token);
        } catch {
          localStorage.removeItem('accessToken');
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().setLoading(false);
      }
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
