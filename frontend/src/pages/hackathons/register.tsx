import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, DollarSign, Calendar, CheckCircle2,
  Loader2, CreditCard, UserPlus, LogIn, ExternalLink,
  AlertTriangle, Info, Check, Lock, ArrowRight,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { hackathonService } from '@/services/hackathons';
import { registrationService } from '@/services/registrations';
import { teamService } from '@/services/teams';
import { paymentService, type OrderResponse } from '@/services/payments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { unwrapData } from '@/utils/unwrap-data';
import type { Hackathon } from '@/types/hackathon';
import type { Team, TeamMember } from '@/types/team';
import type { Registration } from '@/types/registration';

const WIZARD_KEY = 'hackhub-register-wizard';

interface WizardState {
  step: 'overview' | 'team' | 'payment' | 'confirm';
  teamName: string;
  selectedTeamId: string | null;
  registrationId: string | null;
}

function loadWizardState(slug: string): WizardState | null {
  try {
    const raw = localStorage.getItem(`${WIZARD_KEY}-${slug}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveWizardState(slug: string, state: WizardState) {
  try {
    localStorage.setItem(`${WIZARD_KEY}-${slug}`, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearWizardState(slug: string) {
  try {
    localStorage.removeItem(`${WIZARD_KEY}-${slug}`);
  } catch { /* ignore */ }
}

const stepOrder = ['overview', 'team', 'payment', 'confirm'] as const;

function getStepProgress(current: string): number {
  const idx = stepOrder.indexOf(current as typeof stepOrder[number]);
  return Math.round(((idx + 1) / stepOrder.length) * 100);
}

function shouldShowStep(step: string, hasFee: boolean, maxTeamSize: number): boolean {
  if (step === 'payment' && !hasFee) return false;
  if (step === 'team' && maxTeamSize <= 1) return false;
  return true;
}

export function RegisterPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saved = slug ? loadWizardState(slug) : null;
  const [step, setStep_] = useState<WizardState['step']>(saved?.step ?? 'overview');
  const [teamName, setTeamName_] = useState(saved?.teamName ?? '');
  const [selectedTeamId, setSelectedTeamId_] = useState<string | null>(saved?.selectedTeamId ?? null);
  const [registrationId, setRegistrationId_] = useState<string | null>(saved?.registrationId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<OrderResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const setStep = useCallback((s: WizardState['step']) => {
    setStep_(s);
    if (slug) saveWizardState(slug, { step: s, teamName, selectedTeamId, registrationId });
  }, [slug, teamName, selectedTeamId, registrationId]);

  const setTeamName = useCallback((v: string) => {
    setTeamName_(v);
    if (slug) saveWizardState(slug, { step, teamName: v, selectedTeamId, registrationId });
  }, [slug, step, selectedTeamId, registrationId]);

  const setSelectedTeamId = useCallback((v: string | null) => {
    setSelectedTeamId_(v);
    if (slug) saveWizardState(slug, { step, teamName, selectedTeamId: v, registrationId });
  }, [slug, step, teamName, registrationId]);

  const setRegistrationId = useCallback((v: string | null) => {
    setRegistrationId_(v);
    if (slug) saveWizardState(slug, { step, teamName, selectedTeamId, registrationId: v });
  }, [slug, step, teamName, selectedTeamId]);

  const { data: hackathon, isLoading } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => unwrapData<Hackathon>(r)),
    enabled: !!slug,
    retry: 1,
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations', hackathon?.id],
    queryFn: () => registrationService.my().then((r) => unwrapData<Registration[]>(r)),
    enabled: !!hackathon?.id,
  });

  const existingRegistration = myRegistrations?.find((r) => r.hackathonId === hackathon?.id) ?? null;

  const { data: myTeams } = useQuery({
    queryKey: ['my-teams', hackathon?.id],
    queryFn: () => teamService.getMyTeams().then((r) => unwrapData<Team[]>(r)),
    enabled: !!hackathon?.id,
  });

  const existingTeam = myTeams?.find((t) => t.hackathonId === hackathon?.id) ?? null;

  useEffect(() => {
    if (slug && saved) {
      setStep_(saved.step);
      setTeamName_(saved.teamName);
      setSelectedTeamId_(saved.selectedTeamId);
      setRegistrationId_(saved.registrationId);
    }
  }, []);

  const registerMutation = useMutation({
    mutationFn: () => {
      if (!hackathon) throw new Error('No hackathon');
      return registrationService.create({
        hackathonId: hackathon.id,
        teamId: selectedTeamId ?? undefined,
      });
    },
    onSuccess: (res) => {
      const reg = unwrapData<Registration>(res);
      const rid = reg.id;
      setRegistrationId(rid);
      if (slug) saveWizardState(slug, { step, teamName, selectedTeamId, registrationId: rid });
      queryClient.invalidateQueries({ queryKey: ['dashboard-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });

      const hasFee = hackathon!.registrationFee && parseFloat(hackathon!.registrationFee) > 0;
      if (hasFee) {
        setStep('payment');
        createPaymentOrder(rid);
      } else {
        setStep('confirm');
      }
    },
    onError: (err: unknown) => {
      setError((err as any)?.response?.data?.message ?? (err as Error).message);
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: () => {
      if (!hackathon || !teamName.trim()) throw new Error('Team name required');
      return teamService.create({ hackathonId: hackathon.id, name: teamName.trim() });
    },
    onSuccess: (res) => {
      const team = unwrapData<Team>(res);
      setSelectedTeamId(team.id);
      setError(null);
    },
    onError: (err: unknown) => {
      setError((err as any)?.response?.data?.message ?? (err as Error).message);
    },
  });

  const createPaymentOrder = useCallback(async (rid: string) => {
    setPaymentLoading(true);
    setError(null);
    try {
      const res = await paymentService.createOrder(rid);
      const order = unwrapData<OrderResponse>(res);
      setPaymentOrder(order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment setup failed');
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  const handleRazorpaySuccess = useCallback((paymentId: string) => {
    setPaymentOrder(null);
    setStep('confirm');
    if (slug) clearWizardState(slug);
  }, [slug]);

  const handleProceedFromOverview = useCallback(() => {
    setError(null);
    if (existingRegistration) {
      setRegistrationId(existingRegistration.id);
      const hasFee = hackathon!.registrationFee && parseFloat(hackathon!.registrationFee) > 0;
      if (hasFee && !existingRegistration.payment) {
        setStep('payment');
        createPaymentOrder(existingRegistration.id);
      } else {
        setStep('confirm');
      }
      return;
    }
    if (existingTeam) {
      setSelectedTeamId(existingTeam.id);
      registerMutation.mutate();
      return;
    }
    if (hackathon!.minTeamSize > 1) {
      setStep('team');
    } else {
      registerMutation.mutate();
    }
  }, [existingRegistration, existingTeam, hackathon, registerMutation, createPaymentOrder]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <ErrorState
        title="Hackathon not found"
        message="The hackathon you're looking for doesn't exist."
        onRetry={() => navigate('/hackathons')}
      />
    );
  }

  const hasFee = Boolean(hackathon.registrationFee && parseFloat(hackathon.registrationFee) > 0);

  const visibleSteps = stepOrder.filter((s) => shouldShowStep(s, hasFee, hackathon.maxTeamSize));
  const currentStepIndex = visibleSteps.indexOf(step);
  const progress = getStepProgress(step);

  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">
          Step {currentStepIndex + 1} of {visibleSteps.length}
        </span>
        <span className="text-xs font-medium text-accent">{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dim transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-0">
        {visibleSteps.map((s, i) => {
          const labels: Record<string, string> = { overview: 'Overview', team: 'Team', payment: 'Payment', confirm: 'Done' };
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          return (
            <div key={s} className="flex items-center gap-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium transition-colors',
                  isDone && 'bg-accent text-white',
                  isActive && 'bg-accent/20 text-accent border border-accent',
                  !isDone && !isActive && 'bg-bg-elevated text-text-muted',
                )}>
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cn(
                  'text-xs hidden sm:inline',
                  isActive && 'font-medium text-text-primary',
                  isDone && 'text-text-muted',
                  !isDone && !isActive && 'text-text-muted/60',
                )}>
                  {labels[s]}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div className={cn('h-px flex-1 mx-2', i < currentStepIndex ? 'bg-accent' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderOverviewStep = () => (
    <motion.div
      key="overview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h2 className="text-xl font-bold text-text-primary">{hackathon.title}</h2>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">{hackathon.description}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
              <Users className="h-4 w-4 text-accent" />
              Team Size
            </div>
            <p className="font-medium text-text-primary">{hackathon.minTeamSize}–{hackathon.maxTeamSize} members</p>
            {hackathon.minTeamSize === 1 && <p className="text-xs text-text-muted mt-0.5">Solo registration allowed</p>}
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
              <DollarSign className="h-4 w-4 text-accent" />
              Registration Fee
            </div>
            <p className="font-medium text-text-primary">{hasFee ? `$${parseFloat(hackathon.registrationFee).toFixed(2)}` : 'Free'}</p>
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
              <Calendar className="h-4 w-4 text-accent" />
              Deadline
            </div>
            <p className="font-medium text-text-primary">{new Date(hackathon.registrationDeadline).toLocaleDateString()}</p>
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
              <Info className="h-4 w-4 text-accent" />
              Approval Mode
            </div>
            <p className="font-medium text-text-primary">
              {hackathon.registrationMode === 'APPROVAL_REQUIRED' ? 'Approval Required' : 'Auto-Approved'}
            </p>
          </div>
        </div>

        {existingRegistration && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/5 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span className="text-text-secondary">You already have a registration for this hackathon.</span>
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-lg bg-error-bg p-3 text-sm text-error flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          className="flex-1 gap-2 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90"
          disabled={registerMutation.isPending}
          onClick={handleProceedFromOverview}
        >
          {registerMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : existingRegistration ? (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          ) : hackathon.minTeamSize === 1 ? (
            <>
              Register Now <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Continue to Team <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderTeamStep = () => (
    <motion.div
      key="team"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold text-text-primary">Team Setup</h2>
      <p className="text-sm text-text-muted">
        {hackathon.minTeamSize}–{hackathon.maxTeamSize} members required.
        {hackathon.minTeamSize === 1 && ' Solo participation is allowed.'}
      </p>

      {error && (
        <div className="rounded-lg bg-error-bg p-3 text-sm text-error flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {existingTeam ? (
        <Card className="p-5 border-accent/30 bg-accent/[0.02]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium text-text-primary">Using existing team: {existingTeam.name}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {existingTeam.members?.length ?? 0} / {hackathon.maxTeamSize} members
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {existingTeam.members?.map((m: TeamMember) => (
              <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-bg-elevated px-2.5 py-1">
                <Avatar name={m.user.name} size="xs" />
                <span className="text-xs text-text-secondary">{m.user.name}</span>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="mt-4 gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90"
            onClick={() => {
              setSelectedTeamId(existingTeam.id);
              registerMutation.mutate();
            }}
          >
            Continue with This Team <ArrowRight className="h-3 w-3" />
          </Button>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <UserPlus className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Create New Team</h3>
                <p className="text-xs text-text-muted">Enter a name for your team</p>
              </div>
            </div>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
            />
            <Button
              className="mt-3 w-full gap-2"
              disabled={!teamName.trim() || createTeamMutation.isPending}
              onClick={() => createTeamMutation.mutate()}
            >
              {createTeamMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Create Team
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated">
                <LogIn className="h-5 w-5 text-text-muted" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Join Existing Team</h3>
                <p className="text-xs text-text-muted">Ask your team lead to send you an invitation</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate('/team/invitations')}
            >
              <ExternalLink className="h-4 w-4" />
              View Pending Invitations
            </Button>
          </Card>
        </>
      )}

      <Button variant="ghost" onClick={() => setStep('overview')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Overview
      </Button>
    </motion.div>
  );

  const renderPaymentStep = () => (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Card className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          {paymentLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          ) : paymentOrder ? (
            <CreditCard className="h-8 w-8 text-accent" />
          ) : (
            <Lock className="h-8 w-8 text-accent" />
          )}
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          {paymentLoading ? 'Setting up payment...' : paymentOrder ? 'Complete Payment' : 'Payment'}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Registration fee: <span className="font-semibold text-text-primary">${parseFloat(hackathon.registrationFee).toFixed(2)}</span>
        </p>
        {paymentOrder && (
          <p className="mt-1 text-xs text-text-muted">
            Amount: {(paymentOrder.amount / 100).toFixed(2)} {paymentOrder.currency}
          </p>
        )}
      </Card>

      {error && (
        <div className="rounded-lg bg-error-bg p-3 text-sm text-error flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(hackathon.maxTeamSize > 1 ? 'team' : 'overview')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          className="flex-1 gap-2 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90"
          disabled={!paymentOrder || paymentLoading}
          onClick={() => {
            if (paymentOrder) {
              paymentService.openRazorpay(paymentOrder, handleRazorpaySuccess, (err) => {
                setError('Payment was cancelled. You can retry.');
              });
            }
          }}
        >
          {paymentLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : paymentOrder ? (
            <>
              Pay ${parseFloat(hackathon.registrationFee).toFixed(2)} <CreditCard className="h-4 w-4" />
            </>
          ) : (
            'Setting up...'
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderConfirmStep = () => (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="space-y-6"
    >
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Registration Submitted!</h2>
        <p className="mt-2 text-sm text-text-muted max-w-md mx-auto">
          {existingRegistration?.status === 'PENDING_PAYMENT'
            ? 'We are waiting for your payment to be confirmed. This may take a moment.'
            : hackathon.registrationMode === 'APPROVAL_REQUIRED'
              ? 'Your registration is pending approval. You will be notified once approved.'
              : hasFee
                ? 'Your payment is being processed. Your spot will be confirmed shortly.'
                : 'You are registered! Head to your dashboard to get started.'}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-text-muted">
          <div className="rounded-lg bg-bg-elevated px-4 py-2">
            Status: <span className="font-medium text-text-primary">{existingRegistration?.status ?? 'PENDING'}</span>
          </div>
          {hackathon.registrationMode === 'APPROVAL_REQUIRED' && (
            <div className="rounded-lg bg-bg-elevated px-4 py-2">
              Approval: <span className="font-medium text-warning">Pending</span>
            </div>
          )}
        </div>

        <div className="mt-6 text-left rounded-lg bg-accent/5 p-4">
          <p className="text-sm font-medium text-text-primary mb-2">Next Steps:</p>
          <ul className="space-y-1.5 text-sm text-text-muted">
            {hasFee && existingRegistration?.status === 'PENDING_PAYMENT' && (
              <li className="flex items-center gap-2">• Complete your payment to secure your spot</li>
            )}
            {hackathon.registrationMode === 'APPROVAL_REQUIRED' && (
              <li className="flex items-center gap-2">• Wait for admin approval</li>
            )}
            {hackathon.maxTeamSize > 1 && (
              <li className="flex items-center gap-2">• Invite team members to join your team</li>
            )}
            <li className="flex items-center gap-2">• Watch for stage announcements and deadlines</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => { if (slug) clearWizardState(slug); navigate('/dashboard'); }} className="gap-2">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate(`/hackathons/${slug}`)}>
            View Hackathon
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="mx-auto max-w-2xl py-8">
      {renderProgressIndicator()}

      {existingRegistration?.status === 'APPROVED' && step !== 'confirm' && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You are already registered and approved for this hackathon.
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'overview' && renderOverviewStep()}
        {step === 'team' && renderTeamStep()}
        {step === 'payment' && renderPaymentStep()}
        {step === 'confirm' && renderConfirmStep()}
      </AnimatePresence>
    </div>
  );
}
