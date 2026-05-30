import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useIsMobile } from '@/hooks/use-media-query';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hackathons', label: 'Hackathons', icon: Users },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-bg-base">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-bg-surface transition-transform duration-200 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/" className={cn('text-lg font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent', !sidebarOpen && 'lg:hidden')}>
            H
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 text-text-muted hover:text-text-primary"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                location.pathname === item.href
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="sm" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-muted hover:text-error hover:bg-error-bg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-bg-surface px-4 lg:px-6">
          <button
            className="lg:hidden rounded-md p-1.5 text-text-muted hover:text-text-primary"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/notifications" className="relative rounded-md p-1.5 text-text-muted hover:text-text-primary">
              <Bell className="h-5 w-5" />
              <Badge variant="error" size="sm" className="absolute -top-0.5 -right-0.5">3</Badge>
            </Link>
            <Avatar name={user?.name} size="sm" src={user?.avatar} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
