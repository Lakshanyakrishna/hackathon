import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Mail, Shield, Trash2, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { userService } from '@/services/users';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useUIStore } from '@/stores/ui-store';
import { unwrapData } from '@/utils/unwrap-data';
import type { User } from '@/types/user';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [search, setSearch] = useState('');

  const { data: raw, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.list({ limit: '100' }).then((r) => unwrapData<User[]>(r)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); addToast({ type: 'success', title: 'User deleted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed to delete user', message: (e as any)?.response?.data?.message ?? e.message }),
  });

  const users = (raw ?? []).filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
        <ErrorState title="Failed to load users" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-muted mt-0.5">{users.length} user{users.length !== 1 && 's'}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState title={search ? 'No matching users' : 'No users found'} />
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-medium text-accent">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                  </div>
                </div>
                <Badge variant={u.role === 'SUPER_ADMIN' ? 'accent' : 'neutral'} size="sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {u.role === 'SUPER_ADMIN' ? 'Admin' : 'Participant'}
                </Badge>
                {u.role !== 'SUPER_ADMIN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:text-error"
                    disabled={deleteMut.isPending}
                    onClick={() => { if (window.confirm(`Delete user "${u.name}"?`)) deleteMut.mutate(u.id); }}
                  >
                    {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
