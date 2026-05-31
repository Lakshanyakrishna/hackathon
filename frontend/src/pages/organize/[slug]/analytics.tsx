import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, CheckCircle2,
  FileText, TrendingUp, Download, RefreshCw,
} from 'lucide-react';
import { analyticsService } from '@/services/analytics';
import { hackathonService } from '@/services/hackathons';
import { registrationService } from '@/services/registrations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { unwrapData } from '@/utils/unwrap-data';
import type { Hackathon } from '@/types/hackathon';

import type { Registration } from '@/types/registration';

export function AnalyticsPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: hackathon,
    isError: hackathonError,
    refetch: refetchHackathon,
  } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => unwrapData<Hackathon>(r)),
    enabled: !!slug,
  });

  const {
    data: funnel,
  } = useQuery({
    queryKey: ['analytics-funnel', hackathon?.id],
    queryFn: () => analyticsService.funnel(hackathon!.id).then((r) => r.data ?? r),
    enabled: !!hackathon?.id,
  });

  const {
    data: registrations,
    isError: regError,
    refetch: refetchReg,
  } = useQuery({
    queryKey: ['registrations', hackathon?.id],
    queryFn: () => registrationService.list({ hackathonId: hackathon!.id }).then((r) => unwrapData<Registration[]>(r)),
    enabled: !!hackathon?.id,
  });

  if (!hackathon) {
    if (hackathonError) {
      return (
        <ErrorState
          title="Failed to load hackathon"
          message="Could not load analytics data. Please try again."
          onRetry={() => refetchHackathon()}
        />
      );
    }
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (regError) {
    return (
      <ErrorState
        title="Failed to load registration data"
        message="Could not load analytics data. Please try again."
        onRetry={() => refetchReg()}
      />
    );
  }

  const totalReg = registrations?.length ?? 0;
  const paidReg = registrations?.filter((r) => r.payment?.status === 'SUCCESS').length ?? 0;
  const approvedReg = registrations?.filter((r) => r.status === 'APPROVED').length ?? 0;
  const pendingReg = registrations?.filter((r) => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_PAYMENT').length ?? 0;

  // Build 5 funnels
  const funnels = [
    {
      title: 'Registration Funnel',
      icon: Users,
      stages: [
        { label: 'Total Registrations', value: totalReg, pct: 100 },
        { label: 'Paid', value: paidReg, pct: totalReg > 0 ? Math.round((paidReg / totalReg) * 100) : 0 },
        { label: 'Approved', value: approvedReg, pct: totalReg > 0 ? Math.round((approvedReg / totalReg) * 100) : 0 },
      ],
    },
    {
      title: 'Payment Funnel',
      icon: DollarSign,
      stages: [
        { label: 'Total Registrations', value: totalReg, pct: 100 },
        { label: 'Initiated Payments', value: registrations?.filter((r) => r.payment).length ?? 0, pct: totalReg > 0 ? Math.round(((registrations?.filter((r) => r.payment).length ?? 0) / totalReg) * 100) : 0 },
        { label: 'Successful Payments', value: paidReg, pct: totalReg > 0 ? Math.round((paidReg / totalReg) * 100) : 0 },
      ],
    },
    {
      title: 'Team Formation Funnel',
      icon: Users,
      stages: [
        { label: 'Approved', value: approvedReg, pct: 100 },
        { label: 'In Teams', value: approvedReg, pct: 100 },
        { label: 'Active Teams', value: approvedReg, pct: 100 },
      ],
    },
    {
      title: 'Submission Funnel',
      icon: FileText,
      stages: [
        { label: 'Approved Teams', value: approvedReg, pct: 100 },
        { label: 'Submitted', value: 0, pct: 0 },
        { label: 'Locked', value: 0, pct: 0 },
      ],
    },
    {
      title: 'Stage Progression Funnel',
      icon: TrendingUp,
      stages: [
        { label: 'Stage 1', value: 0, pct: 0 },
        { label: 'Stage 2', value: 0, pct: 0 },
        { label: 'Stage 3', value: 0, pct: 0 },
      ],
    },
  ];

  const exportCSV = (type: string) => {
    if (!registrations) return;
    let csv = '';
    switch (type) {
      case 'registrations':
        csv = 'ID,Status,Registered At\n' + registrations.map((r) => `${r.id},${r.status},${r.registeredAt}`).join('\n');
        break;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${hackathon.slug}-${type}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-1">{hackathon.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV('registrations')}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Registrations', value: totalReg, icon: Users, color: 'text-accent' },
          { label: 'Paid', value: paidReg, icon: DollarSign, color: 'text-success' },
          { label: 'Approved', value: approvedReg, icon: CheckCircle2, color: 'text-accent' },
          { label: 'Pending', value: pendingReg, icon: RefreshCw, color: 'text-warning' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/5 p-2.5"><s.icon className={cn('h-5 w-5', s.color)} /></div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 5 Funnels */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {funnels.map((funnel) => (
          <Card key={funnel.title} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <funnel.icon className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-text-primary">{funnel.title}</h3>
            </div>
            <div className="space-y-4">
              {funnel.stages.map((stage, i) => (
                <div key={stage.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-muted">{stage.label}</span>
                    <span className="font-medium text-text-primary">{stage.value}</span>
                  </div>
                  <Progress value={stage.pct} variant={i === 0 ? 'default' : 'gradient'} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Funnel from API if available */}
      {funnel?.funnel && funnel.funnel.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4">Detailed Funnel</h3>
          <div className="space-y-4">
            {funnel.funnel.map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-primary font-medium">{stage.stage}</span>
                  <span className="text-text-muted">{stage.count} ({stage.percentage}%)</span>
                </div>
                <Progress value={stage.percentage} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
