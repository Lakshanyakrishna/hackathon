import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/utils/cn';

export function ProfileDropdown() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/v1/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    logout();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <Avatar name={user?.name} size="sm" src={user?.avatar} />
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 animate-fade-in rounded-lg border border-border bg-bg-surface shadow-xl z-50">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <div className="p-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            {user?.role === 'SUPER_ADMIN' && (
              <Link
                to="/organize"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <Settings className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
          </div>
          <div className="border-t border-border p-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error-bg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
