import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import {
  LayoutDashboard, ArrowUpDown, FileText, Award, Megaphone, Settings,
  Plus, Pencil, Trash2, Save, Eye, ExternalLink,
  Loader2, CheckCircle2, AlertTriangle, Users,
  Calendar, DollarSign, Clock,
  Trophy, ChevronDown, ChevronUp, Globe, Lock,
} from 'lucide-react';
import { hackathonService } from '@/services/hackathons';
import { analyticsService } from '@/services/analytics';
import { registrationService } from '@/services/registrations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui-store';
import { StagePipeline } from '@/components/organizer/stage-pipeline';
import { InlineEditor } from '@/components/organizer/inline-editor';
import { PreviewOverlay } from '@/components/organizer/preview-overlay';
import { RequirementsBuilder } from '@/components/organizer/requirements-builder';
import { EvaluationCriteriaBuilder } from '@/components/organizer/evaluation-criteria-builder';
import type {
  Hackathon, StageConfig, Rule, Prize,
  ProblemStatement, Announcement,
  EvaluationCriterion, PromotionRule,
} from '@/types/hackathon';
import type { AnalyticsFunnel } from '@/types/api';
import type { Registration } from '@/types/registration';

export function OrganizerWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const tab = searchParams.get('tab') || 'overview';
  const [previewOpen, setPreviewOpen] = useState(false);

  const setTab = useCallback((t: string) => {
    if (t === 'overview') setSearchParams({}, { replace: true });
    else setSearchParams({ tab: t }, { replace: true });
  }, [setSearchParams]);

  const { data: hackathon, isLoading, isError, refetch } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => (r.data ?? r) as Hackathon),
    enabled: !!slug,
  });

  const { data: stages } = useQuery({
    queryKey: ['hackathon-stages', hackathon?.id],
    queryFn: () => hackathonService.stages.list(hackathon!.id).then((r) => (r.data ?? r) as StageConfig[]),
    enabled: !!hackathon?.id,
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  if (isError || !hackathon) return <ErrorState title="Failed to load hackathon" onRetry={() => refetch()} />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'stages', label: 'Stages', icon: ArrowUpDown },
    { id: 'rules', label: 'Rules', icon: FileText },
    { id: 'prizes', label: 'Prizes', icon: Award },
    { id: 'problems', label: 'Problems', icon: FileText },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{hackathon.title}</h1>
          <p className="text-sm text-text-muted mt-0.5 flex items-center gap-2">
            <Badge variant={hackathon.status === 'DRAFT' ? 'warning' : hackathon.status === 'PUBLISHED' ? 'success' : hackathon.status === 'ONGOING' ? 'accent' : 'default'} size="sm">
              {hackathon.status}
            </Badge>
            {hackathon.mode} · {new Date(hackathon.startDate).toLocaleDateString()} – {new Date(hackathon.endDate).toLocaleDateString()}
            {stages && <span>· {stages.length} stage{stages.length !== 1 && 's'}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/hackathons/${hackathon.slug}`, '_blank')}>
            <ExternalLink className="h-4 w-4" /> Live
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'overview' && <OverviewTab hackathon={hackathon} />}
          {tab === 'stages' && <StagesSection hackathon={hackathon} />}
          {tab === 'rules' && <RulesSection hackathon={hackathon} />}
          {tab === 'prizes' && <PrizesSection hackathon={hackathon} />}
          {tab === 'problems' && <ProblemsSection hackathon={hackathon} />}
          {tab === 'announcements' && <AnnouncementsSection hackathon={hackathon} />}
          {tab === 'settings' && <SettingsSection hackathon={hackathon} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['hackathon', slug] })} />}
        </motion.div>
      </AnimatePresence>

      <PreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        hackathon={hackathon}
        stages={stages ?? []}
      />
    </div>
  );
}

/* ===================== OVERVIEW ===================== */

function OverviewTab({ hackathon }: { hackathon: Hackathon }) {
  const navigate = useNavigate();

  const { data: funnel } = useQuery({
    queryKey: ['analytics-funnel', hackathon.id],
    queryFn: () => analyticsService.funnel(hackathon.id).then((r) => r.data ?? r) as Promise<AnalyticsFunnel>,
  });

  const { data: registrations } = useQuery({
    queryKey: ['registrations', hackathon.id],
    queryFn: () => registrationService.list({ hackathonId: hackathon.id }).then((r) => (r.data ?? r) as Registration[]),
    enabled: !!hackathon.id,
  });

  const allRegs = registrations ?? [];
  const approved = allRegs.filter((r) => r.status === 'APPROVED').length;
  const pending = allRegs.filter((r) => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_PAYMENT').length;
  const paid = allRegs.filter((r) => r.payment?.status === 'SUCCESS').length;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Registrations', value: allRegs.length, icon: Users, color: 'text-accent', sub: `${approved} approved` },
          { label: 'Pending', value: pending, icon: Clock, color: 'text-warning', sub: 'Awaiting action' },
          { label: 'Payments', value: paid, icon: DollarSign, color: 'text-success', sub: `${allRegs.filter((r) => r.payment).length} total` },
          { label: 'Approved Teams', value: approved, icon: CheckCircle2, color: 'text-accent', sub: `${Math.round((approved / (allRegs.length || 1)) * 100)}% rate` },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/5 p-2.5"><s.icon className={cn('h-5 w-5', s.color)} /></div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
                {s.sub && <p className="text-[10px] text-text-muted mt-0.5">{s.sub}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Conversion funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-text-primary mb-4">Conversion Funnel</h3>
          {funnel?.funnel && funnel.funnel.length > 0 ? (
            <div className="space-y-4">
              {funnel.funnel.map((stage) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-text-primary font-medium">{stage.stage}</span>
                    <span className="text-text-muted">{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <Progress value={stage.percentage} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No data yet" description="Funnel will populate as participants register." />
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-text-primary mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Stages', icon: ArrowUpDown, href: '?tab=stages' },
                { label: 'View Registrations', icon: Users, href: `/organize/${hackathon.slug}/registrations` },
                { label: 'Review Submissions', icon: FileText, href: `/organize/${hackathon.slug}/submissions` },
                { label: 'Edit Prizes', icon: Award, href: '?tab=prizes' },
                { label: 'Post Announcement', icon: Megaphone, href: '?tab=announcements' },
              ].map((action) => (
                <Button key={action.label} variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => {
                  if (action.href.startsWith('?')) window.location.hash = action.href;
                  else navigate(action.href);
                }}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-text-primary mb-3">Hackathon Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Status</span><Badge variant={hackathon.status === 'DRAFT' ? 'warning' : hackathon.status === 'PUBLISHED' ? 'success' : hackathon.status === 'ONGOING' ? 'accent' : 'default'} size="sm">{hackathon.status}</Badge></div>
              <div className="flex justify-between"><span className="text-text-muted">Mode</span><span className="font-medium">{hackathon.mode}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Fee</span><span className="font-medium">{hackathon.registrationFee === '0' || !hackathon.registrationFee ? 'Free' : `₹${parseInt(hackathon.registrationFee).toLocaleString()}`}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Approval</span><Badge variant={hackathon.approvalRequired ? 'warning' : 'success'} size="sm">{hackathon.approvalRequired ? 'Required' : 'Auto'}</Badge></div>
              <div className="flex justify-between"><span className="text-text-muted">Solo</span><span className="font-medium">{hackathon.allowSoloRegistration ? 'Allowed' : 'Team only'}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ===================== STAGES ===================== */

type StageForm = {
  name: string; description: string; startDate: string; endDate: string;
  isActive: boolean;
  requirements: { key: string; label: string; type: string; required: boolean; placeholder?: string; validation?: Record<string, unknown> }[];
  evaluationCriteria: EvaluationCriterion[];
  promotionType: string; promotionValue: string;
};

const emptyStageForm: StageForm = {
  name: '', description: '', startDate: '', endDate: '', isActive: true,
  requirements: [], evaluationCriteria: [],
  promotionType: 'MANUAL_SELECTION', promotionValue: '',
};

function StagesSection({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageConfig | null>(null);
  const [form, setForm] = useState<StageForm>(emptyStageForm);

  const { data: stages, isLoading } = useQuery({
    queryKey: ['hackathon-stages', hackathon.id],
    queryFn: () => hackathonService.stages.list(hackathon.id).then((r) => (r.data ?? r) as StageConfig[]),
  });

  const sorted = [...(stages ?? [])].sort((a, b) => a.order - b.order);

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => hackathonService.stages.create(hackathon.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-stages'] }); setModalOpen(false); setForm(emptyStageForm); addToast({ type: 'success', title: 'Stage created' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hackathonService.stages.update(hackathon.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-stages'] }); setModalOpen(false); setEditingStage(null); setForm(emptyStageForm); addToast({ type: 'success', title: 'Stage updated' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonService.stages.delete(hackathon.id, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-stages'] }); addToast({ type: 'success', title: 'Stage deleted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => hackathonService.stages.reorder(hackathon.id, { stageIds: ids }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-stages'] }); addToast({ type: 'success', title: 'Stages reordered' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const openCreate = () => { setEditingStage(null); setForm(emptyStageForm); setModalOpen(true); };
  const openEdit = (s: StageConfig) => {
    setEditingStage(s);
    setForm({
      name: s.name, description: s.description ?? '',
      startDate: s.startDate ? s.startDate.slice(0, 16) : '', endDate: s.endDate ? s.endDate.slice(0, 16) : '',
      isActive: s.isActive,
      requirements: (s.requirements as unknown as StageForm['requirements']) ?? [],
      evaluationCriteria: (s.evaluationCriteria as StageForm['evaluationCriteria']) ?? [],
      promotionType: s.promotionRule?.type ?? 'MANUAL_SELECTION',
      promotionValue: s.promotionRule?.value?.toString() ?? '',
    });
    setModalOpen(true);
  };
  const handleDelete = (s: StageConfig) => { if (window.confirm(`Delete stage "${s.name}"?`)) deleteMut.mutate(s.id); };

  const handleSave = () => {
    if (!form.name.trim()) { addToast({ type: 'error', title: 'Stage name is required' }); return; }

    const promotionRule: PromotionRule = form.promotionType === 'MANUAL_SELECTION'
      ? { type: 'MANUAL_SELECTION' }
      : { type: form.promotionType as 'TOP_N' | 'MINIMUM_SCORE', value: Number(form.promotionValue) };

    const data: Record<string, unknown> = {
      name: form.name, description: form.description,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isActive: form.isActive,
      requirements: form.requirements, evaluationCriteria: form.evaluationCriteria, promotionRule,
    };
    if (editingStage) updateMut.mutate({ id: editingStage.id, data });
    else createMut.mutate(data);
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <StagePipeline
        stages={sorted}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        onMoveUp={(i) => { if (i === 0) return; const a = [...sorted]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; reorderMut.mutate(a.map((s) => s.id)); }}
        onMoveDown={(i) => { if (i >= sorted.length - 1) return; const a = [...sorted]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; reorderMut.mutate(a.map((s) => s.id)); }}
      />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingStage(null); setForm(emptyStageForm); }} title={editingStage ? 'Edit Stage' : 'Create Stage'} size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Stage Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ideation" />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="sa" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border" />
              <label htmlFor="sa" className="text-sm text-text-primary">Active</label>
            </div>
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Stage description..." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Submission Requirements</h4>
            <RequirementsBuilder
              value={form.requirements}
              onChange={(reqs) => setForm({ ...form, requirements: reqs })}
            />
          </div>

          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Evaluation Criteria</h4>
            <EvaluationCriteriaBuilder
              value={form.evaluationCriteria}
              onChange={(crits) => setForm({ ...form, evaluationCriteria: crits })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Promotion Rule" value={form.promotionType} onChange={(e) => setForm({ ...form, promotionType: e.target.value })} options={[
              { label: 'Manual Selection', value: 'MANUAL_SELECTION' },
              { label: 'Top N', value: 'TOP_N' },
              { label: 'Minimum Score', value: 'MINIMUM_SCORE' },
            ]} />
            {form.promotionType !== 'MANUAL_SELECTION' && (
              <Input label="Value" type="number" value={form.promotionValue} onChange={(e) => setForm({ ...form, promotionValue: e.target.value })} placeholder={form.promotionType === 'TOP_N' ? 'N teams' : 'Min score'} />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); setEditingStage(null); setForm(emptyStageForm); }}>Cancel</Button>
            <Button className="bg-gradient-to-r from-accent to-pink hover:opacity-90 gap-2" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.name.trim()}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingStage ? 'Update Stage' : 'Create Stage'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== RULES ===================== */

function RulesSection({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: rules, isLoading } = useQuery({
    queryKey: ['hackathon-rules', hackathon.id],
    queryFn: () => hackathonService.rules.list(hackathon.id).then((r) => (r.data ?? r) as Rule[]),
  });

  const sorted = [...(rules ?? [])].sort((a, b) => a.order - b.order);

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => hackathonService.rules.create(hackathon.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-rules'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Rule created' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hackathonService.rules.update(hackathon.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-rules'] }); addToast({ type: 'success', title: 'Rule updated' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonService.rules.delete(hackathon.id, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-rules'] }); addToast({ type: 'success', title: 'Rule deleted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const reorderMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hackathonService.rules.update(hackathon.id, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hackathon-rules'] }),
    onError: (e: Error) => addToast({ type: 'error', title: 'Reorder failed', message: e.message }),
  });

  const reset = () => { setTitle(''); setDescription(''); setEditing(null); };
  const openCreate = () => { reset(); setModalOpen(true); };
  const handleSave = () => {
    const data = { title, description, order: editing?.order ?? sorted.length + 1 };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const handleInlineUpdate = (ruleId: string, data: Record<string, unknown>) => {
    updateMut.mutate({ id: ruleId, data });
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{sorted.length} rule{sorted.length !== 1 && 's'}</p>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4" /> Add Rule</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No rules yet" description="Add rules so participants know the guidelines." action={{ label: 'Add Rule', onClick: openCreate }} />
      ) : (
        <div className="space-y-2">
          {sorted.map((rule, i) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-accent/5 text-xs font-bold text-accent shrink-0 mt-0.5">{rule.order}</div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <InlineEditor
                    value={rule.title}
                    onSave={(v) => handleInlineUpdate(rule.id, { title: v })}
                    placeholder="Rule title..."
                    className="w-full"
                  />
                  <InlineEditor
                    value={rule.description ?? ''}
                    onSave={(v) => handleInlineUpdate(rule.id, { description: v })}
                    placeholder="Rule description..."
                    multiline
                    className="w-full"
                  />
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (i > 0) { const a = [...sorted]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; a.forEach((r, idx) => reorderMut.mutate({ id: r.id, data: { order: idx + 1 } })); }
                  }} aria-label="Move up" disabled={i === 0}><ChevronUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (i < sorted.length - 1) { const a = [...sorted]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; a.forEach((r, idx) => reorderMut.mutate({ id: r.id, data: { order: idx + 1 } })); }
                  }} aria-label="Move down" disabled={i === sorted.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" aria-label="Delete" className="text-error hover:text-error" onClick={() => { if (confirm('Delete this rule?')) deleteMut.mutate(rule.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title={editing ? 'Edit Rule' : 'Add Rule'}>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Team Formation" />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rule details..." />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); reset(); }}>Cancel</Button>
            <Button className="bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={handleSave} disabled={!title.trim() || createMut.isPending || updateMut.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== PRIZES ===================== */

function PrizesSection({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Prize | null>(null);
  const [form, setForm] = useState({ position: 1, title: '', amount: '', description: '', category: '' });

  const { data: prizes, isLoading } = useQuery({
    queryKey: ['hackathon-prizes', hackathon.id],
    queryFn: () => hackathonService.prizes.list(hackathon.id).then((r) => (r.data ?? r) as Prize[]),
  });

  const sorted = [...(prizes ?? [])].sort((a, b) => a.position - b.position);
  const totalPool = sorted.reduce((sum, p) => sum + Number(p.amount), 0);

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => hackathonService.prizes.create(hackathon.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-prizes'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Prize added' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hackathonService.prizes.update(hackathon.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-prizes'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Prize updated' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonService.prizes.delete(hackathon.id, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-prizes'] }); addToast({ type: 'success', title: 'Prize removed' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const reset = () => setForm({ position: sorted.length + 1, title: '', amount: '', description: '', category: '' });
  const openCreate = () => { reset(); setModalOpen(true); };
  const openEdit = (p: Prize) => { setEditing(p); setForm({ position: p.position, title: p.title ?? '', amount: p.amount, description: p.description ?? '', category: '' }); setModalOpen(true); };
  const handleSave = () => {
    const data = { position: Number(form.position), title: form.title, amount: form.amount, description: form.description };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      {/* Prize pool summary */}
      <Card className="bg-gradient-to-br from-accent/5 to-pink/5 border-accent/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-muted">Total Prize Pool</p>
            <p className="text-3xl font-bold text-text-primary">₹{totalPool.toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center"><p className="text-lg font-bold text-text-primary">{sorted.length}</p><p className="text-xs text-text-muted">Prizes</p></div>
            <div className="text-center"><p className="text-lg font-bold text-accent">{sorted.length > 0 ? Math.round(totalPool / sorted.length) : 0}</p><p className="text-xs text-text-muted">Avg</p></div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{sorted.length} prize{sorted.length !== 1 && 's'}</p>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4" /> Add Prize</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No prizes yet" description="Set prizes to attract participants." action={{ label: 'Add Prize', onClick: openCreate }} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((prize) => (
            <motion.div key={prize.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={cn('p-4', prize.position === 1 && 'border-warning/40')}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    prize.position === 1 ? 'bg-warning/10' : prize.position === 2 ? 'bg-bg-elevated' : prize.position === 3 ? 'bg-amber-700/10' : 'bg-accent/5',
                  )}>
                    <Trophy className={cn('h-4 w-4', prize.position === 1 ? 'text-warning' : prize.position === 2 ? 'text-text-muted' : prize.position === 3 ? 'text-amber-700' : 'text-accent')} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{prize.title || `Prize #${prize.position}`}</p>
                    <p className="text-xs text-text-muted">{prize.position === 1 ? 'Winner' : prize.position === 2 ? 'Runner-up' : prize.position === 3 ? 'Second Runner-up' : `Position ${prize.position}`}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-accent">₹{Number(prize.amount).toLocaleString()}</p>
                {prize.description && <p className="text-xs text-text-muted mt-1">{prize.description}</p>}
                <div className="flex gap-1 mt-3">
                  <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(prize)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" aria-label="Delete" className="text-error hover:text-error" onClick={() => { if (confirm('Delete this prize?')) deleteMut.mutate(prize.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title={editing ? 'Edit Prize' : 'Add Prize'}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Position" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} min={1} />
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Grand Prize" />
            <Input label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="10000" />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Prize details..." />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); reset(); }}>Cancel</Button>
            <Button className="bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={handleSave} disabled={!form.amount || createMut.isPending || updateMut.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== PROBLEMS ===================== */

function ProblemsSection({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProblemStatement | null>(null);
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD', technologies: '', resources: '', isActive: true });

  const { data: problems, isLoading } = useQuery({
    queryKey: ['hackathon-problems', hackathon.id],
    queryFn: () => hackathonService.problemStatements.list(hackathon.id).then((r) => (r.data ?? r) as ProblemStatement[]),
  });

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => hackathonService.problemStatements.create(hackathon.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-problems'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Problem created' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hackathonService.problemStatements.update(hackathon.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-problems'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Problem updated' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonService.problemStatements.delete(hackathon.id, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-problems'] }); addToast({ type: 'success', title: 'Problem deleted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const reset = () => setForm({ title: '', description: '', difficulty: 'MEDIUM', technologies: '', resources: '', isActive: true });
  const openCreate = () => { reset(); setModalOpen(true); };
  const openEdit = (p: ProblemStatement) => { setEditing(p); setForm({ title: p.title, description: p.description, difficulty: p.difficulty as 'EASY' | 'MEDIUM' | 'HARD', technologies: p.technologies.join(', '), resources: p.resources.join(', '), isActive: p.isActive }); setModalOpen(true); };
  const handleSave = () => {
    const data = { title: form.title, description: form.description, difficulty: form.difficulty, isActive: form.isActive, technologies: form.technologies.split(',').map((s) => s.trim()).filter(Boolean), resources: form.resources.split(',').map((s) => s.trim()).filter(Boolean) };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const diffStyles: Record<string, string> = { EASY: 'text-success bg-success/5 border-success/20', MEDIUM: 'text-warning bg-warning/5 border-warning/20', HARD: 'text-error bg-error/5 border-error/20' };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{(problems ?? []).length} problem{(problems ?? []).length !== 1 && 's'} · {(problems ?? []).filter((p) => p.isActive).length} visible</p>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4" /> Add Problem</Button>
      </div>

      {(problems ?? []).length === 0 ? (
        <EmptyState title="No problems yet" description="Add problem statements participants will work on." action={{ label: 'Add Problem', onClick: openCreate }} />
      ) : (
        <div className="space-y-2">
          {(problems ?? []).map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <Card className={cn('p-4', !p.isActive && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-text-primary">{p.title}</span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', diffStyles[p.difficulty] || '')}>{p.difficulty}</span>
                      {!p.isActive && <Badge variant="default" size="sm">Hidden</Badge>}
                    </div>
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>
                    {p.technologies.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {p.technologies.map((t) => <Badge key={t} variant="accent" size="sm">{t}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label="Delete" className="text-error hover:text-error" onClick={() => { if (confirm('Delete this problem?')) deleteMut.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title={editing ? 'Edit Problem' : 'Add Problem'} size="lg">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Smart City Dashboard" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description..." className="min-h-[100px]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })} options={[
              { label: 'Easy', value: 'EASY' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Hard', value: 'HARD' },
            ]} />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="pa" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border" />
              <label htmlFor="pa" className="text-sm text-text-primary">Visible to participants</label>
            </div>
          </div>
          <Input label="Technologies (comma-separated)" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, Python" />
          <Input label="Resources (comma-separated)" value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="https://docs.example.com" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); reset(); }}>Cancel</Button>
            <Button className="bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={handleSave} disabled={!form.title.trim() || !form.description.trim() || createMut.isPending || updateMut.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== ANNOUNCEMENTS ===================== */

function AnnouncementsSection({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isPinned: false, scheduledAt: '', status: 'published' as 'draft' | 'published' | 'scheduled' });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['hackathon-announcements', hackathon.id],
    queryFn: () => hackathonService.announcements.list(hackathon.id).then((r) => (r.data ?? r) as Announcement[]),
  });

  const sorted = [...(announcements ?? [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => hackathonService.announcements.create(hackathon.id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-announcements'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Announcement posted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hackathonService.announcements.update(hackathon.id, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-announcements'] }); setModalOpen(false); reset(); addToast({ type: 'success', title: 'Announcement updated' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonService.announcements.delete(hackathon.id, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hackathon-announcements'] }); addToast({ type: 'success', title: 'Announcement deleted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const reset = () => setForm({ title: '', content: '', isPinned: false, scheduledAt: '', status: 'published' });
  const openCreate = () => { reset(); setModalOpen(true); };
  const openEdit = (a: Announcement) => {
    const isScheduled = a.scheduledAt && new Date(a.scheduledAt) > new Date();
    setEditing(a);
    setForm({
      title: a.title, content: a.content, isPinned: a.isPinned,
      scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : '',
      status: isScheduled ? 'scheduled' : a.isPinned ? 'published' : 'published',
    });
    setModalOpen(true);
  };
  const handleSave = () => {
    const data: Record<string, unknown> = {
      title: form.title,
      content: form.content,
      isPinned: form.isPinned,
      scheduledAt: form.status === 'scheduled' && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    };
    if (form.status === 'draft') {
      data.isActive = false;
      data.scheduledAt = null;
    } else {
      data.isActive = true;
    }
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{sorted.length} announcement{sorted.length !== 1 && 's'}</p>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={openCreate}><Plus className="h-4 w-4" /> New Announcement</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No announcements" description="Keep participants informed with updates." action={{ label: 'Post Announcement', onClick: openCreate }} />
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => {
            const isScheduled = a.scheduledAt && new Date(a.scheduledAt) > new Date();
            const isPast = a.scheduledAt && new Date(a.scheduledAt) <= new Date();
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={cn('p-4', a.isPinned && 'border-accent/30', isScheduled && 'border-blue-500/30', !a.isActive && !isScheduled && 'opacity-50')}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-text-primary">{a.title}</span>
                        {a.isPinned && <Badge variant="accent" size="sm">Pinned</Badge>}
                        {isScheduled && <Badge variant="default" size="sm" className="border-blue-500/30 text-blue-400"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>}
                        {!a.isActive && !isScheduled && <Badge variant="default" size="sm">Draft</Badge>}
                        <span className="text-xs text-text-muted">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{a.content}</p>
                      {a.scheduledAt && (
                        <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {isPast ? 'Published' : 'Scheduled'}: {new Date(a.scheduledAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" aria-label="Delete" className="text-error hover:text-error" onClick={() => { if (confirm('Delete this announcement?')) deleteMut.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title={editing ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title..." />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' | 'scheduled' })} options={[
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
              { label: 'Scheduled', value: 'scheduled' },
            ]} />
          </div>
          <Textarea label="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your announcement..." className="min-h-[150px]" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ap" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="rounded border-border" />
            <label htmlFor="ap" className="text-sm text-text-primary">Pin this announcement</label>
          </div>
          {form.status === 'scheduled' && (
            <Input label="Schedule Date" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); reset(); }}>Cancel</Button>
            <Button className="bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={handleSave} disabled={!form.title.trim() || !form.content.trim() || createMut.isPending || updateMut.isPending}>
              {editing ? 'Update' : form.status === 'draft' ? 'Save Draft' : form.status === 'scheduled' ? 'Schedule' : 'Publish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== SETTINGS ===================== */

function SettingsSection({ hackathon, onUpdate }: { hackathon: Hackathon; onUpdate: () => void }) {
  const addToast = useUIStore((s) => s.addToast);
  const [form, setForm] = useState({
    title: hackathon.title,
    description: hackathon.description,
    mode: hackathon.mode,
    location: hackathon.location ?? '',
    coverImage: hackathon.coverImage ?? '',
    startDate: hackathon.startDate.slice(0, 16),
    endDate: hackathon.endDate.slice(0, 16),
    registrationStartDate: hackathon.registrationStartDate.slice(0, 16),
    registrationEndDate: hackathon.registrationEndDate.slice(0, 16),
    registrationFee: hackathon.registrationFee,
    maxTeamSize: hackathon.maxTeamSize,
    minTeamSize: hackathon.minTeamSize,
    allowSoloRegistration: hackathon.allowSoloRegistration,
    approvalRequired: hackathon.approvalRequired,
  });

  const updateMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => hackathonService.update(hackathon.id, d),
    onSuccess: () => { addToast({ type: 'success', title: 'Settings saved' }); onUpdate(); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const publishMut = useMutation({
    mutationFn: () => hackathonService.publish(hackathon.id),
    onSuccess: () => { addToast({ type: 'success', title: 'Hackathon published!' }); onUpdate(); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });
  const archiveMut = useMutation({
    mutationFn: () => hackathonService.archive(hackathon.id),
    onSuccess: () => { addToast({ type: 'success', title: 'Hackathon archived' }); onUpdate(); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed', message: e.message }),
  });

  const handleSave = () => {
    const data: Record<string, unknown> = {
      title: form.title, description: form.description,
      mode: form.mode, location: form.location || null, coverImage: form.coverImage || null,
      startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(),
      registrationStartDate: new Date(form.registrationStartDate).toISOString(),
      registrationEndDate: new Date(form.registrationEndDate).toISOString(),
      registrationFee: form.registrationFee,
      maxTeamSize: Number(form.maxTeamSize), minTeamSize: Number(form.minTeamSize),
      allowSoloRegistration: form.allowSoloRegistration, approvalRequired: form.approvalRequired,
    };
    updateMut.mutate(data);
  };

  const showPublish = hackathon.status === 'DRAFT';
  const showArchive = hackathon.status === 'PUBLISHED' || hackathon.status === 'ONGOING';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-text-muted">Configure your hackathon settings</p>
        <div className="flex gap-2">
          {showPublish && (
            <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => { if (confirm('Publish this hackathon? It will be visible to participants.')) publishMut.mutate(); }} disabled={publishMut.isPending}>
              {publishMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} Publish
            </Button>
          )}
          {showArchive && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { if (confirm('Archive this hackathon? This will hide it.')) archiveMut.mutate(); }}>
              <Lock className="h-4 w-4" /> Archive
            </Button>
          )}
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-pink hover:opacity-90" onClick={handleSave} disabled={updateMut.isPending}>
            {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </div>
      </div>

      {/* Branding */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-accent" /> Branding & Description
        </h3>
        <div className="space-y-4">
          <Input label="Hackathon Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. HACKATHON 2026" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px]" placeholder="Describe your hackathon..." />
          <Input label="Cover Image URL" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://images.example.com/banner.jpg" helperText="Shown on the landing page and share cards" />
          {form.coverImage && (
            <div className="h-32 w-full overflow-hidden rounded-lg border border-border bg-bg-elevated">
              <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>
      </Card>

      {/* Registration windows */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" /> Registration Windows
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Hackathon Start" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Hackathon End" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Registration Opens" type="datetime-local" value={form.registrationStartDate} onChange={(e) => setForm({ ...form, registrationStartDate: e.target.value })} />
            <Input label="Registration Closes" type="datetime-local" value={form.registrationEndDate} onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {/* Team & Registration Config */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" /> Team & Registration
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Min Team Size" type="number" value={form.minTeamSize} onChange={(e) => setForm({ ...form, minTeamSize: Number(e.target.value) })} min={1} />
            <Input label="Max Team Size" type="number" value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} min={1} />
            <Input label="Fee (₹)" type="number" value={form.registrationFee} onChange={(e) => setForm({ ...form, registrationFee: e.target.value })} min={0} placeholder="0 = free" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ss" checked={form.allowSoloRegistration} onChange={(e) => setForm({ ...form, allowSoloRegistration: e.target.checked })} className="rounded border-border" />
              <label htmlFor="ss" className="text-sm text-text-primary">Allow solo registration</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ar" checked={form.approvalRequired} onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })} className="rounded border-border" />
              <label htmlFor="ar" className="text-sm text-text-primary">Manual approval required</label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as 'ONLINE' | 'OFFLINE' | 'HYBRID' })} options={[
              { label: 'Online', value: 'ONLINE' },
              { label: 'Offline', value: 'OFFLINE' },
              { label: 'Hybrid', value: 'HYBRID' },
            ]} />
            <Input label="Location / Platform" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={form.mode === 'ONLINE' ? 'e.g. Discord, Zoom link' : 'Physical venue'} />
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      {hackathon.status === 'DRAFT' && (
        <Card className="border-error/30 p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-error" /> Danger Zone
          </h3>
          <p className="text-sm text-text-muted mb-3">Once published, this hackathon becomes visible to participants and can receive registrations.</p>
          <Button className="bg-gradient-to-r from-accent to-pink hover:opacity-90 gap-2" onClick={() => { if (confirm('Ready to publish?')) publishMut.mutate(); }}>
            <Globe className="h-4 w-4" /> Publish Hackathon
          </Button>
        </Card>
      )}
    </div>
  );
}
