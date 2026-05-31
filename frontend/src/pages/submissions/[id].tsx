import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, Lock, FileText,
} from 'lucide-react';
import { submissionService } from '@/services/submissions';
import { SubmissionHistory } from '@/components/submission/submission-history';
import { DeadlineTimer } from '@/components/submission/deadline-timer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { unwrapData } from '@/utils/unwrap-data';
import type { Submission } from '@/types/submission';

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: submission, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionService.getById(id!).then((r) => unwrapData<Submission>(r)),
    enabled: !!id,
    retry: 1,
  });

  const { data: versions } = useQuery({
    queryKey: ['submission-versions', id],
    queryFn: () => submissionService.versions(id!).then((r) => unwrapData<Submission[]>(r)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <ErrorState
        title="Submission not found"
        message={(error as Error)?.message ?? 'Submission not found'}
        onRetry={() => refetch()}
      />
    );
  }

  const data = (submission.data ?? {}) as Record<string, string>;
  const requirements = (submission.stage?.requirements as unknown as Array<{ key: string; label: string; type: string; required: boolean }>) ?? [];

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
                {submission.stage?.name ?? 'Submission'}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {submission.team?.name} · v{submission.version}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DeadlineTimer deadline={submission.stage?.endDate} />
            <Badge
              variant={submission.status === 'LOCKED' ? 'accent' : submission.status === 'SUBMITTED' ? 'success' : 'warning'}
              size="lg"
            >
              {submission.status === 'LOCKED' && <Lock className="h-3 w-3 mr-1" />}
              {submission.status}
            </Badge>
            {submission.status === 'DRAFT' && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate(`/submissions/${id}/edit`)}>
                <Edit className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold text-text-primary mb-4">Submission Data</h2>
              <div className="space-y-4">
                {requirements.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <FileText className="h-12 w-12 text-text-muted mb-3" />
                    <p className="text-sm text-text-muted">No structured data available</p>
                  </div>
                ) : (
                  requirements.map((req, i) => {
                    const val = data[req.key];
                    const hasValue = val !== undefined && val !== null && val !== '';
                    return (
                      <motion.div
                        key={req.key}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          'rounded-lg p-4 border',
                          hasValue ? 'border-accent/20 bg-accent/[0.02]' : 'border-border bg-bg-elevated/30',
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-primary">{req.label}</span>
                              <Badge variant="accent" size="sm">{req.type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary break-all">
                              {hasValue ? String(val) : '—'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Status</span>
                  <Badge variant={submission.status === 'DRAFT' ? 'warning' : submission.status === 'SUBMITTED' ? 'success' : 'accent'} size="sm">
                    {submission.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Version</span>
                  <span className="font-medium text-text-primary">{submission.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Team</span>
                  <span className="font-medium text-text-primary">{submission.team?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Stage</span>
                  <span className="font-medium text-text-primary">{submission.stage?.name}</span>
                </div>
                {submission.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Submitted</span>
                    <span className="font-medium text-text-primary">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                )}
                {submission.submittedBy && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">By</span>
                    <span className="font-medium text-text-primary">{submission.submittedBy}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Created</span>
                  <span className="font-medium text-text-primary">{new Date(submission.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>

            <SubmissionHistory
              versions={versions ?? []}
              currentVersion={submission}
              onViewVersion={(vid) => navigate(`/submissions/${vid}`)}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
