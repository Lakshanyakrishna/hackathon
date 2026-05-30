import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Users, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try { await fetch('/api/v1/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-bg-base">
      <aside className="flex w-64 flex-col border-r border-border bg-bg-surface">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Shield className="h-5 w-5 text-accent" />
          <span className="font-semibold text-text-primary">Admin</span>
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
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="text-sm text-text-muted mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-muted hover:text-error hover:bg-error-bg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
