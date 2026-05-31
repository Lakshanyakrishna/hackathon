import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Trophy, Plus, Trash2, RefreshCw, Medal, Award, Star,
  Palette, Loader2,
} from 'lucide-react';
import { winnerService } from '@/services/winners';
import { hackathonService } from '@/services/hackathons';
import { teamService } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { unwrapData } from '@/utils/unwrap-data';
import { useUIStore } from '@/stores/ui-store';
import type { Winner } from '@/types/winner';
import type { Hackathon } from '@/types/hackathon';
import type { Team } from '@/types/team';

const AWARD_TYPES = [
  { value: 'Winner', label: 'Winner', icon: Trophy },
  { value: 'Runner-Up', label: 'Runner-Up', icon: Medal },
  { value: 'Second Runner-Up', label: 'Second Runner-Up', icon: Medal },
  { value: 'Best Innovation', label: 'Best Innovation', icon: Star },
  { value: 'Best UI/UX', label: 'Best UI/UX', icon: Palette },
  { value: 'Custom', label: 'Custom Award', icon: Award },
];

const awardColors: Record<string, string> = {
  'Winner': 'text-warning bg-warning/10 border-warning/20',
  'Runner-Up': 'text-text-muted bg-bg-elevated border-border',
  'Second Runner-Up': 'text-amber-700 bg-amber-700/10 border-amber-700/20',
  'Best Innovation': 'text-accent bg-accent/10 border-accent/20',
  'Best UI/UX': 'text-pink bg-pink/10 border-pink/20',
};

export function WinnersPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ teamId: '', awardTitle: 'Winner', awardTitleCustom: '', prizeId: '' });

  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => unwrapData<Hackathon>(r)),
    enabled: !!slug,
  });

  const { data: winners, isLoading, isError, refetch } = useQuery({
    queryKey: ['winners', hackathon?.id],
    queryFn: () => winnerService.list(hackathon!.id).then((r) => unwrapData<Winner[]>(r)),
    enabled: !!hackathon?.id,
  });

  const { data: allTeams } = useQuery({
    queryKey: ['teams', hackathon?.id],
    queryFn: () => teamService.list().then((r) => unwrapData<Team[]>(r)),
    enabled: !!hackathon?.id,
  });

  const { data: prizes } = useQuery({
    queryKey: ['hackathon-prizes', hackathon?.id],
    queryFn: () => hackathonService.prizes.list(hackathon!.id).then((r) => unwrapData<Array<{ id: string; title?: string | null; amount: string }>>(r)),
    enabled: !!hackathon?.id,
  });

  const createMut = useMutation({
    mutationFn: (d: { teamId: string; awardTitle: string; prizeId?: string }) => winnerService.create(hackathon!.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['winners'] }); setModalOpen(false); resetForm(); addToast({ type: 'success', title: 'Winner added' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => winnerService.remove(hackathon!.id, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['winners'] }); addToast({ type: 'success', title: 'Winner removed' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const resetForm = () => setForm({ teamId: '', awardTitle: 'Winner', awardTitleCustom: '', prizeId: '' });
  const teamOptions = (allTeams ?? []).map((t) => ({ label: t.name, value: t.id }));
  const prizeOptions = (prizes ?? []).map((p) => ({ label: `${p.title || `Prize #${(prizes ?? []).indexOf(p) + 1}`} (₹${Number(p.amount).toLocaleString()})`, value: p.id }));
  const isCustom = form.awardTitle === 'Custom';

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (isError || !hackathon) return <ErrorState title="Failed to load" onRetry={() => refetch()} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Winners</h1>
          <p className="text-sm text-text-muted mt-1">{hackathon.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90" onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Winner
          </Button>
        </div>
      </div>

      {(!winners || winners.length === 0) ? (
        <EmptyState
          icon={<Trophy className="h-12 w-12" />}
          title="No winners yet"
          description="Add winners to celebrate teams that excelled in your hackathon."
          action={{ label: 'Add Winner', onClick: () => { resetForm(); setModalOpen(true); } }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {winners.map((winner, i) => {
            const isStandard = AWARD_TYPES.slice(0, 3).some((a) => a.value === winner.awardTitle);
            const colorClass = awardColors[winner.awardTitle] || 'text-accent bg-accent/5 border-accent/20';
            const AwardIcon = AWARD_TYPES.find((a) => a.value === winner.awardTitle)?.icon || Award;
            return (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn('p-5 border', isStandard ? 'border-yellow-500/20' : 'border-accent/20')}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClass)}>
                      <AwardIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{winner.team.name}</p>
                      <Badge variant="neutral" size="sm" className={cn('mt-0.5', colorClass)}>{winner.awardTitle}</Badge>
                    </div>
                  </div>
                  {winner.prize && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Prize</span>
                      <span className="font-medium text-accent">₹{Number(winner.prize.amount).toLocaleString()}</span>
                    </div>
                  )}
                  {winner.team.members && winner.team.members.length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {winner.team.members.slice(0, 5).map((m) => (
                        <div key={m.id} className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 border-2 border-bg-surface text-[10px] font-medium text-accent">
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" className="text-error hover:text-error" onClick={() => { if (confirm('Remove this winner?')) deleteMut.mutate(winner.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Winner">
        <div className="space-y-4">
          <Select label="Team" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} options={teamOptions} placeholder="Select team..." />
          <Select label="Award Type" value={form.awardTitle} onChange={(e) => setForm({ ...form, awardTitle: e.target.value })} options={AWARD_TYPES} />
          {isCustom && (
            <Input label="Custom Award Title" value={form.awardTitleCustom} onChange={(e) => setForm({ ...form, awardTitleCustom: e.target.value })} placeholder="e.g. People's Choice" />
          )}
          {prizeOptions.length > 0 && (
            <Select label="Prize (optional)" value={form.prizeId} onChange={(e) => setForm({ ...form, prizeId: e.target.value })} options={[{ label: 'No prize', value: '' }, ...prizeOptions]} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="bg-gradient-to-r from-accent to-accent-dim hover:opacity-90 gap-2" onClick={() => {
              const title = isCustom && form.awardTitleCustom ? form.awardTitleCustom : form.awardTitle;
              if (!form.teamId) { addToast({ type: 'error', title: 'Select a team' }); return; }
              createMut.mutate({ teamId: form.teamId, awardTitle: title, prizeId: form.prizeId || undefined });
            }} disabled={createMut.isPending || !form.teamId}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Winner
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
