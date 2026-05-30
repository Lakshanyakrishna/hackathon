import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Trophy,
  Award,
  BarChart3,
  Users,
  Megaphone,
  Menu,
  X,
  Eye,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useIsMobile } from '@/hooks/use-media-query';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { hackathonService } from '@/services/hackathons';

export function OrganizerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const { data: hackathon } = useQuery({
    queryKey: ['hackathons', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then(r => r.data),
    enabled: !!slug,
  });

  const navItems = [
    { href: `/organize/${slug}`, label: 'Overview', icon: Settings },
    { href: `/organize/${slug}/analytics`, label: 'Analytics', icon: BarChart3 },
  ];

  const sectionItems = [
    { href: `/organize/${slug}?tab=stages`, label: 'Stages', icon: LayoutDashboard },
    { href: `/organize/${slug}?tab=rules`, label: 'Rules', icon: FileText },
    { href: `/organize/${slug}?tab=prizes`, label: 'Prizes', icon: Award },
    { href: `/organize/${slug}?tab=problems`, label: 'Problems', icon: FileText },
    { href: `/organize/${slug}?tab=announcements`, label: 'Announcements', icon: Megaphone },
    { href: `/organize/${slug}/submissions`, label: 'Submissions', icon: Users },
    { href: `/organize/${slug}/winners`, label: 'Winners', icon: Trophy },
  ];

  const handleLogout = async () => {
    try { await fetch('/api/v1/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    logout();
    navigate('/');
  };

  const handlePreview = () => {
    if (hackathon?.slug) {
      window.open(`/hackathons/${hackathon.slug}`, '_blank');
    }
  };

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return location.pathname + location.search === href;
    }
    return location.pathname === href;
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
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/organize')} className="text-text-muted hover:text-text-primary">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className={cn('text-sm font-semibold text-text-primary truncate', !sidebarOpen && 'lg:hidden')}>
              {hackathon?.title || 'Workspace'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 text-text-muted hover:text-text-primary"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 p-3">
          <p className={cn('px-3 text-xs font-medium text-text-muted uppercase tracking-wider pt-2 pb-1', !sidebarOpen && 'lg:hidden')}>
            Main
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}

          <p className={cn('px-3 text-xs font-medium text-text-muted uppercase tracking-wider pt-4 pb-1', !sidebarOpen && 'lg:hidden')}>
            Sections
          </p>
          {sectionItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.href)
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
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 mb-2"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" />
              View as Participant
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="sm" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
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

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-bg-surface px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden rounded-md p-1.5 text-text-muted hover:text-text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-text-primary hidden sm:block">
              {hackathon?.title || 'Organizer Workspace'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={handlePreview}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
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
