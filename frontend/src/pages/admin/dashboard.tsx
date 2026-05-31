import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, LayoutList, Plus, Activity, ExternalLink, Calendar, BarChart3 } from 'lucide-react';
import { hackathonService } from '@/services/hackathons';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { unwrapData } from '@/utils/unwrap-data';
import type { Hackathon } from '@/types/hackathon';

const statusBadge = (s: string) =>
  s === 'PUBLISHED' ? 'success' as const : s === 'ONGOING' ? 'accent' as const : s === 'COMPLETED' ? 'neutral' as const : 'warning' as const;

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: hackathons, isLoading } = useQuery({
    queryKey: ['admin-hackathons'],
    queryFn: () => hackathonService.list().then((r) => unwrapData<Hackathon[]>(r)),
  });

  const list = hackathons ?? [];
  const totalParticipants = list.reduce((s, h) => s + (h as any)._count?.registrations ?? 0, 0);
  const totalTeams = list.reduce((s, h) => s + (h as any)._count?.teams ?? 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90" onClick={() => navigate('/organize')}>
          <Plus className="h-4 w-4" /> Manage Hackathons
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <LayoutList className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{isLoading ? '...' : list.length}</p>
              <p className="text-xs text-text-muted">Total Hackathons</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink/10">
              <Users className="h-5 w-5 text-pink" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{isLoading ? '...' : totalParticipants}</p>
              <p className="text-xs text-text-muted">Total Registrations</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{isLoading ? '...' : totalTeams}</p>
              <p className="text-xs text-text-muted">Total Teams</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-text-primary mb-4">Your Hackathons</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : list.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              No hackathons yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg bg-bg-elevated p-3 cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => navigate(`/organize/${h.slug}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{h.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                      <Calendar className="h-3 w-3" />
                      {new Date(h.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={statusBadge(h.status)} size="sm">{h.status}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-text-primary mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <div
              className="flex items-center gap-3 rounded-lg bg-accent/5 p-3 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => navigate('/organize')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Plus className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Create or Manage Hackathons</p>
                <p className="text-xs text-text-muted">Set up stages, prizes, rules, and more</p>
              </div>
              <ExternalLink className="h-4 w-4 text-text-muted" />
            </div>
            <div
              className="flex items-center gap-3 rounded-lg bg-bg-elevated p-3 cursor-pointer hover:bg-bg-hover transition-colors"
              onClick={() => navigate('/admin/users')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink/10">
                <Users className="h-5 w-5 text-pink" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Manage Users</p>
                <p className="text-xs text-text-muted">View and manage participants</p>
              </div>
              <ExternalLink className="h-4 w-4 text-text-muted" />
            </div>
            <div
              className="flex items-center gap-3 rounded-lg bg-bg-elevated p-3 cursor-pointer hover:bg-bg-hover transition-colors"
              onClick={() => navigate('/organize')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Review Submissions</p>
                <p className="text-xs text-text-muted">Score and promote teams</p>
              </div>
              <ExternalLink className="h-4 w-4 text-text-muted" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/organize')}>
          <LayoutList className="h-4 w-4" /> View All Hackathons
        </Button>
      </div>
    </div>
  );
}
