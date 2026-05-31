import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, AlertTriangle,
  Loader2, CheckCircle2, FileText,
  Star, Award,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { submissionService } from '@/services/submissions';
import { hackathonService } from '@/services/hackathons';
import { teamService } from '@/services/teams';
import { DynamicSubmissionForm } from '@/components/submission/dynamic-submission-form';
import { SubmissionPreview } from '@/components/submission/submission-preview';
import { SubmissionHistory } from '@/components/submission/submission-history';
import { DeadlineTimer } from '@/components/submission/deadline-timer';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/ui-store';
import type { Submission } from '@/types/submission';
import type { Team } from '@/types/team';
import type { StageConfig, EvaluationCriterion, RequirementField } from '@/types/hackathon';

const STORAGE_KEY_PREFIX = 'hackhub-submission-draft-';

interface DraftEntry {
  data: Record<string, unknown>;
  serverUpdatedAt: string | null;
  draftUpdatedAt: string;
}

function loadDraft(key: string): DraftEntry | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(key: string, entry: DraftEntry) {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(entry)); } catch { /* */ }
}

function clearDraft(key: string) {
  try { localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`); } catch { /* */ }
}

export function SubmissionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const stageId = searchParams.get('stageId');
  const teamId = searchParams.get('teamId');
  const hackathonId = searchParams.get('hackathonId');
  const addToast = useUIStore((s) => s.addToast);

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null);

  const isNew = !id;
  const draftKey = hackathonId && stageId && teamId ? `${hackathonId}-${stageId}-${teamId}` : null;
  const existingDraftKey = id ? `existing-${id}` : null;

  // Guards for race conditions
  const saveLockRef = useRef(false);
  const manualSaveRequestedRef = useRef(false);
  const autoSaveGenerationRef = useRef(0);

  const { data: stage } = useQuery({
    queryKey: ['stage', hackathonId, stageId],
    queryFn: () => hackathonService.stages.get(hackathonId!, stageId!).then((r) => (r.data ?? r) as StageConfig),
    enabled: isNew && !!hackathonId && !!stageId,
  });

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getById(teamId!).then((r) => (r.data ?? r) as Team),
    enabled: isNew && !!teamId,
  });

  const { data: submission, isLoading, isError, refetch } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionService.getById(id!).then((r) => (r.data ?? r) as Submission),
    enabled: !isNew,
    retry: 1,
  });

  const { data: versions } = useQuery({
    queryKey: ['submission-versions', id],
    queryFn: () => submissionService.versions(id!).then((r) => (r.data ?? r) as Submission[]),
    enabled: !isNew,
  });

  // Initialize form data on load with updatedAt comparison
  useEffect(() => {
    if (submission && !isNew) {
      setServerUpdatedAt(submission.updatedAt);
      // Check for local draft for existing submissions
      if (existingDraftKey) {
        const draft = loadDraft(existingDraftKey);
        if (draft && draft.serverUpdatedAt) {
          // Compare timestamps: prefer newer
          const serverTime = new Date(submission.updatedAt).getTime();
          const draftServerTime = new Date(draft.serverUpdatedAt).getTime();
          if (draftServerTime >= serverTime && Object.keys(draft.data).length > 0) {
            setFormData(draft.data);
            addToast({ type: 'info', title: 'Loaded local draft', message: 'Unsaved changes from your last session were restored.' });
            return;
          }
        }
      }
      // Default to server data
      setFormData((submission.data as Record<string, unknown>) ?? {});
    } else if (isNew && draftKey) {
      const draft = loadDraft(draftKey);
      if (draft && Object.keys(draft.data).length > 0) {
        setFormData(draft.data);
        if (draft.serverUpdatedAt) {
          setServerUpdatedAt(draft.serverUpdatedAt);
        }
      }
    }
  }, [submission, isNew, draftKey, existingDraftKey, addToast]);

  // Debounced version of formData for auto-save (existing submissions only)
  const debouncedData = useDebounce(isNew ? null : formData, 2000);

  // Auto-save function
  const performAutoSave = useCallback(async (data: Record<string, unknown>) => {
    if (!id || isNew) return;
    if (manualSaveRequestedRef.current) {
      manualSaveRequestedRef.current = false;
      return;
    }
    const gen = ++autoSaveGenerationRef.current;
    if (saveLockRef.current) return;
    saveLockRef.current = true;
    try {
      await submissionService.update(id, { data });
      setLastSaved(new Date());
      setServerUpdatedAt(new Date().toISOString());
      if (existingDraftKey) {
        saveDraft(existingDraftKey, {
          data,
          serverUpdatedAt: new Date().toISOString(),
          draftUpdatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Silently ignore auto-save errors
    } finally {
      if (autoSaveGenerationRef.current === gen) {
        saveLockRef.current = false;
      }
    }
  }, [id, isNew, existingDraftKey]);

  // Wire auto-save for existing submissions
  useEffect(() => {
    if (isNew || !debouncedData || !id) return;
    performAutoSave(debouncedData);
  }, [debouncedData, id, isNew, performAutoSave]);

  // Persist draft to localStorage on each change
  useEffect(() => {
    if (!draftKey && !existingDraftKey) return;
    if (Object.keys(formData).length === 0) return;
    const key = (isNew ? draftKey : existingDraftKey)!;
    saveDraft(key, {
      data: formData,
      serverUpdatedAt,
      draftUpdatedAt: new Date().toISOString(),
    });
  }, [formData, isNew, draftKey, existingDraftKey, serverUpdatedAt]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (isNew) {
        const res = await submissionService.create({
          hackathonId: hackathonId!,
          teamId: teamId!,
          stageId: stageId!,
          data,
        });
        const sub = res.data ?? (res as unknown as Submission);
        if (draftKey) clearDraft(draftKey);
        navigate(`/submissions/${sub.id}/edit`, { replace: true });
        return sub;
      }
      return submissionService.update(id!, { data });
    },
    onSuccess: () => {
      setLastSaved(new Date());
      if (id) {
        setServerUpdatedAt(new Date().toISOString());
        if (existingDraftKey) clearDraft(existingDraftKey);
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // Acquire lock: abort pending auto-saves
      autoSaveGenerationRef.current++;
      saveLockRef.current = true;
      try {
        let subId = id;
        if (!subId) {
          const res = await submissionService.create({
            hackathonId: hackathonId!,
            teamId: teamId!,
            stageId: stageId!,
            data,
          });
          const sub = res.data ?? (res as unknown as Submission);
          subId = sub.id;
          if (draftKey) clearDraft(draftKey);
          navigate(`/submissions/${subId}`, { replace: true });
        } else {
          await submissionService.update(subId, { data });
        }
        await submissionService.submit(subId);
        return subId;
      } finally {
        saveLockRef.current = false;
      }
    },
    onSuccess: (subId) => {
      if (existingDraftKey) clearDraft(existingDraftKey);
      queryClient.invalidateQueries({ queryKey: ['submission', subId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-submissions'] });
      navigate(`/submissions/${subId}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSave = useCallback(async () => {
    setError(null);
    // Cancel any pending auto-save by incrementing generation
    autoSaveGenerationRef.current++;
    manualSaveRequestedRef.current = true;

    if (saveLockRef.current) {
      addToast({ type: 'warning', title: 'Save in progress', message: 'Please wait for the current save to complete.' });
      return;
    }
    saveLockRef.current = true;
    try {
      if (isNew) {
        const res = await submissionService.create({
          hackathonId: hackathonId!,
          teamId: teamId!,
          stageId: stageId!,
          data: formData,
        });
        const sub = res.data ?? (res as unknown as Submission);
        if (draftKey) clearDraft(draftKey);
        navigate(`/submissions/${sub.id}/edit`, { replace: true });
      } else {
        await submissionService.update(id!, { data: formData });
        setServerUpdatedAt(new Date().toISOString());
        if (existingDraftKey) clearDraft(existingDraftKey);
      }
      setLastSaved(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      saveLockRef.current = false;
    }
  }, [formData, isNew, id, hackathonId, teamId, stageId, navigate, draftKey, existingDraftKey, addToast]);

  const isReadOnly = !isNew && submission?.status !== 'DRAFT';

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState title="Failed to load submission" onRetry={() => refetch()} />
    );
  }

  const stageForPreview = isNew ? stage : submission?.stage;
  const deadline = stageForPreview?.endDate;

  if (showPreview && stageForPreview) {
    const previewFields = (isNew
      ? ((stage?.requirements ?? []) as RequirementField[])
      : ((submission?.stage?.requirements ?? []) as RequirementField[])
    ).map((r) => ({
      key: r.key,
      label: r.label,
      type: r.type,
      value: formData[r.key],
      required: r.required,
    }));

    return (
      <div className="mx-auto max-w-3xl py-8">
        <SubmissionPreview
          fields={previewFields}
          stage={stageForPreview as StageConfig}
          teamName={team?.name ?? submission?.team?.name ?? ''}
          deadline={deadline}
          onConfirm={() => submitMutation.mutate(formData)}
          onBack={() => setShowPreview(false)}
          isSubmitting={submitMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {isNew ? 'New Submission' : 'Edit Submission'}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {isNew && stage ? `Stage ${stage.order}: ${stage.name}` : submission?.stage?.name ?? ''}
                {isNew && team ? ` · ${team.name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DeadlineTimer deadline={deadline} />
            {!isReadOnly && (
              <Badge variant="warning" size="sm">
                <FileText className="h-3 w-3 mr-1" />
                DRAFT
              </Badge>
            )}
            {isReadOnly && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {submission?.status}
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-error-bg p-3 text-sm text-error flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <DynamicSubmissionForm
                requirements={isNew
                  ? ((stage?.requirements ?? []) as RequirementField[])
                  : ((submission?.stage?.requirements ?? []) as RequirementField[])
                }
                initialData={formData}
                onDataChange={(data) => {
                  setFormData(data);
                  // Reset error on user edit
                  if (error) setError(null);
                }}
                onSave={handleSave}
                isSaving={saveMutation.isPending || saveLockRef.current}
                lastSaved={lastSaved}
                isSubmitting={submitMutation.isPending}
                readOnly={isReadOnly}
              />
            </Card>

            {!isReadOnly && (
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || saveLockRef.current}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Draft
                </Button>
                <Button
                  size="lg"
                  className="flex-1 gap-2 bg-gradient-to-r from-accent to-pink hover:opacity-90"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4" />
                  Review & Submit
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {submission && (
              <Card className="p-5">
                <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted mb-3">Submission Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status</span>
                    <Badge variant={submission.status === 'DRAFT' ? 'warning' : submission.status === 'SUBMITTED' ? 'success' : 'accent'} size="sm">{submission.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Version</span>
                    <span className="font-medium text-text-primary">v{submission.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Team</span>
                    <span className="font-medium text-text-primary">{submission.team?.name}</span>
                  </div>
                  {submission.submittedAt && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Submitted</span>
                      <span className="font-medium text-text-primary">{new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Last updated</span>
                    <span className="font-medium text-text-primary">{new Date(submission.updatedAt).toLocaleString()}</span>
                  </div>
                  {deadline && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Deadline</span>
                      <span className="font-medium text-text-primary">{new Date(deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Evaluation Criteria */}
            {(isNew ? stage?.evaluationCriteria : submission?.stage?.evaluationCriteria) &&
              ((isNew ? stage?.evaluationCriteria : submission?.stage?.evaluationCriteria) as EvaluationCriterion[]).length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-accent" />
                  Evaluation Criteria
                </h3>
                <div className="space-y-2">
                  {((isNew ? stage?.evaluationCriteria : submission?.stage?.evaluationCriteria) as EvaluationCriterion[]).map((criterion, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-bg-elevated p-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{criterion.name}</p>
                        {criterion.description && (
                          <p className="text-xs text-text-muted mt-0.5">{criterion.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-accent ml-2">{criterion.maxScore}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Promotion Eligibility */}
            {stageForPreview && !isNew && (
              <Card className="p-5">
                <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-accent" />
                  Promotion
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Executed</span>
                    <Badge variant={(stageForPreview as StageConfig).promotionExecuted ? 'success' : 'neutral'} size="sm">
                      {(stageForPreview as StageConfig).promotionExecuted ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {(stageForPreview as StageConfig).promotionRule && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Rule</span>
                      <span className="font-medium text-text-primary">
                        {(stageForPreview as StageConfig).promotionRule?.type === 'TOP_N'
                          ? `Top ${(stageForPreview as StageConfig).promotionRule?.value}`
                          : (stageForPreview as StageConfig).promotionRule?.type === 'MINIMUM_SCORE'
                            ? `Min ${(stageForPreview as StageConfig).promotionRule?.value} pts`
                            : 'Manual'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Eligible</span>
                    <span className="font-medium text-text-primary">
                      {submission?.status === 'SUBMITTED' || submission?.status === 'LOCKED' ? 'Yes' : 'Submit first'}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {submission && (
              <SubmissionHistory
                versions={versions ?? []}
                currentVersion={submission}
                onViewVersion={(vid) => navigate(`/submissions/${vid}`)}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
