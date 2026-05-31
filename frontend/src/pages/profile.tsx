import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, Calendar, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { userService } from '@/services/users';
import { formatDate } from '@/utils/format';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const updateMut = useMutation({
    mutationFn: (data: { name: string; bio?: string }) => userService.update(user!.id, data),
    onSuccess: (r) => {
      setUser({ ...r.data });
      addToast({ type: 'success', title: 'Profile updated' });
    },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed to update profile', message: (e as any)?.response?.data?.message ?? e.message }),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Profile</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user?.name} size="lg" />
          <div>
            <p className="text-lg font-medium text-text-primary">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
            <Badge variant={user?.role === 'SUPER_ADMIN' ? 'accent' : 'neutral'} size="sm" className="mt-1">
              <Shield className="h-3 w-3 mr-1" />
              {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Participant'}
            </Badge>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate({ name, bio }); }} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <div className="pointer-events-none opacity-60">
            <Input label="Email" value={user?.email ?? ''} readOnly />
          </div>
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" rows={3} />
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
            </p>
            <Button type="submit" loading={updateMut.isPending}>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
