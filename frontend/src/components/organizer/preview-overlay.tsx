import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Eye, Users, Calendar, DollarSign, CheckCircle2,
  ArrowRight, User, Shield, Ban, Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Hackathon, StageConfig } from '@/types/hackathon';
import { cn } from '@/utils/cn';

interface PreviewOverlayProps {
  open: boolean;
  onClose: () => void;
  hackathon: Hackathon;
  stages: StageConfig[];
}

type PreviewView = 'landing' | 'registration' | 'dashboard';
type Persona = 'participant' | 'team-lead' | 'eliminated' | 'finalist';

const PERSONAS: { id: Persona; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'participant', label: 'Participant', icon: User, desc: 'Default registered user' },
  { id: 'team-lead', label: 'Team Lead', icon: Shield, desc: 'Team management + submissions' },
  { id: 'eliminated', label: 'Eliminated', icon: Ban, desc: 'Not promoted to next stage' },
  { id: 'finalist', label: 'Finalist', icon: Award, desc: 'Reached final stage' },
];

export function PreviewOverlay({ open, onClose, hackathon, stages }: PreviewOverlayProps) {
  const [view, setView] = useState<PreviewView>('landing');
  const [persona, setPersona] = useState<Persona>('participant');

  if (!open) return null;

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-bg-base"
      >
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-surface px-3 py-2 shrink-0 sm:px-4 sm:h-14 sm:py-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onClose} className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm font-medium text-text-primary hidden sm:inline">Preview</span>
            </div>
            <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded truncate max-w-[120px] sm:max-w-none">{hackathon.title}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Persona selector */}
            <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-bg-elevated">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap sm:px-2.5 sm:py-1.5',
                    persona === p.id ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary',
                  )}
                  title={p.desc}
                >
                  <p.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>
            {/* View selector */}
            <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-bg-elevated">
              {(['landing', 'registration', 'dashboard'] as PreviewView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap sm:px-2.5 sm:py-1.5',
                    view === v ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary',
                  )}
                >
                  {v === 'landing' ? 'Landing' : v === 'registration' ? 'Register' : 'Dashboard'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Persona banner */}
        <div className={cn(
          'px-4 py-2 text-xs font-medium flex items-center gap-2',
          persona === 'participant' && 'bg-accent/5 text-accent',
          persona === 'team-lead' && 'bg-accent/5 text-accent',
          persona === 'eliminated' && 'bg-error/5 text-error',
          persona === 'finalist' && 'bg-warning/5 text-warning',
        )}>
          {PERSONAS.find((p) => p.id === persona)?.icon && (
            <span className="flex items-center gap-1.5">
              {persona === 'participant' && <User className="h-3 w-3" />}
              {persona === 'team-lead' && <Shield className="h-3 w-3" />}
              {persona === 'eliminated' && <Ban className="h-3 w-3" />}
              {persona === 'finalist' && <Award className="h-3 w-3" />}
              Viewing as <strong>{PERSONAS.find((p) => p.id === persona)?.label}</strong>
            </span>
          )}
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
            {view === 'landing' && <LandingPreview hackathon={hackathon} stages={sortedStages} persona={persona} />}
            {view === 'registration' && <RegistrationPreview hackathon={hackathon} persona={persona} />}
            {view === 'dashboard' && <DashboardPreview hackathon={hackathon} stages={sortedStages} persona={persona} />}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex h-10 sm:h-12 items-center justify-center border-t border-border bg-bg-surface text-xs text-text-muted shrink-0 px-2 text-center">
          <Eye className="h-3 w-3 mr-1.5 shrink-0" />
          <span className="truncate">Preview as {PERSONAS.find((p) => p.id === persona)?.label}</span>
          <button onClick={onClose} className="ml-2 text-accent hover:underline shrink-0">Exit</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function LandingPreview({ hackathon, stages, persona }: { hackathon: Hackathon; stages: StageConfig[]; persona: Persona }) {
  const now = new Date();
  const startDate = new Date(hackathon.startDate);
  const endDate = new Date(hackathon.endDate);
  const regEnd = new Date(hackathon.registrationEndDate);
  const isOpen = now >= new Date(hackathon.registrationStartDate) && now <= regEnd;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 via-bg-surface to-accent-dim/5 border border-border p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-3 w-full">
            <div className="flex flex-wrap gap-2">
              <Badge variant={isOpen ? 'success' : 'neutral'} size="sm">{isOpen ? 'OPEN' : 'CLOSED'}</Badge>
              <Badge variant="neutral" size="sm">{hackathon.mode}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{hackathon.title}</h1>
            <p className="text-text-muted text-sm sm:text-base">{hackathon.description}</p>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-accent shrink-0" /> {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-accent shrink-0" /> {hackathon.minTeamSize}–{hackathon.maxTeamSize} members</span>
              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-accent shrink-0" /> {hackathon.registrationFee === '0' || !hackathon.registrationFee ? 'Free' : `₹${parseInt(hackathon.registrationFee).toLocaleString()}`}</span>
            </div>
          </div>
          <div className="hidden sm:block rounded-xl bg-accent/5 p-4 text-center min-w-[140px] shrink-0">
            <p className="text-2xl font-bold text-accent">{stages.length}</p>
            <p className="text-xs text-text-muted">Stages</p>
          </div>
        </div>
      </div>

      {stages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Pipeline</h2>
          <div className="space-y-0">
            {stages.map((stage, i) => (
              <div key={stage.id} className="flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-bold text-white',
                    stage.isActive ? 'bg-accent' : 'bg-text-muted',
                  )}>{stage.order}</div>
                  {i < stages.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                </div>
                <div className="pb-4 sm:pb-6 min-w-0">
                  <h4 className="font-medium text-text-primary text-sm sm:text-base">{stage.name}</h4>
                  {stage.description && <p className="text-xs text-text-muted">{stage.description}</p>}
                  {stage.startDate && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(stage.startDate).toLocaleDateString()}{stage.endDate ? ` – ${new Date(stage.endDate).toLocaleDateString()}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-gradient-to-r from-accent/10 to-accent-dim/5 border border-border p-6 text-center">
        <p className="text-base sm:text-lg font-semibold text-text-primary mb-2">Ready to participate?</p>
        <p className="text-sm text-text-muted mb-4">Registration {isOpen ? 'is open' : 'will open soon'}.</p>
        <Button className="bg-gradient-to-r from-accent to-accent-dim hover:opacity-90 w-full sm:w-auto" disabled={!isOpen || persona === 'eliminated' || persona === 'finalist'}>
          {persona === 'eliminated' ? 'Registration Unavailable' : persona === 'finalist' ? 'Already Registered' : isOpen ? 'Register Now' : 'Registration Closed'}
        </Button>
      </div>
    </div>
  );
}

function RegistrationPreview({ hackathon, persona }: { hackathon: Hackathon; persona: Persona }) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Register for {hackathon.title}</h1>
        <p className="text-sm text-text-muted mt-1">Complete your registration to participate</p>
      </div>

      {persona === 'eliminated' && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-center">
          <Ban className="h-8 w-8 text-error mx-auto mb-2" />
          <p className="font-medium text-text-primary">Registration Closed</p>
          <p className="text-sm text-text-muted">You are not eligible to register for this hackathon.</p>
        </div>
      )}

      <div className={cn('rounded-xl border border-border bg-bg-surface p-6', persona === 'eliminated' && 'opacity-50 pointer-events-none')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">Registration Fee</p>
            <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">
              {hackathon.registrationFee === '0' || !hackathon.registrationFee ? 'Free' : `₹${parseInt(hackathon.registrationFee).toLocaleString()}`}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-accent opacity-50" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          {hackathon.registrationMode === 'APPROVAL_REQUIRED' ? 'Requires admin approval' : 'Auto-approved'}
        </div>
      </div>

      <div className={cn('rounded-xl border border-border bg-bg-surface p-6', persona === 'eliminated' && 'opacity-50 pointer-events-none')}>
        <h3 className="font-semibold text-text-primary mb-3">Team Configuration</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Team size</span><span className="font-medium">{hackathon.minTeamSize}–{hackathon.maxTeamSize} members</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Solo registration</span><span className="font-medium">{hackathon.minTeamSize === 1 ? 'Allowed' : 'Not allowed'}</span></div>
          {persona === 'team-lead' && <div className="flex justify-between"><span className="text-text-muted">Role</span><Badge variant="accent" size="sm">Team Lead</Badge></div>}
          {persona === 'finalist' && <div className="flex justify-between"><span className="text-text-muted">Status</span><Badge variant="success" size="sm">Finalist</Badge></div>}
        </div>
      </div>

      <div className={cn('rounded-xl border border-border bg-bg-surface p-6', persona === 'eliminated' && 'opacity-50 pointer-events-none')}>
        <h3 className="font-semibold text-text-primary mb-3">Registration Steps</h3>
        <div className="space-y-3">
          {[
            { step: '1', label: 'Overview', desc: 'Review hackathon details' },
            { step: '2', label: 'Team', desc: persona === 'team-lead' ? 'Manage your team members' : 'Create or join a team' },
            { step: '3', label: 'Payment', desc: hackathon.registrationFee === '0' || !hackathon.registrationFee ? 'No payment required' : 'Complete payment' },
            { step: '4', label: 'Confirmation', desc: 'Confirm registration' },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/5 text-xs font-bold text-accent shrink-0">{s.step}</div>
              <div className="min-w-0"><p className="text-sm font-medium text-text-primary">{s.label}</p><p className="text-xs text-text-muted">{s.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview({ hackathon, stages, persona }: { hackathon: Hackathon; stages: StageConfig[]; persona: Persona }) {
  const isEliminated = persona === 'eliminated';
  const isFinalist = persona === 'finalist';
  const isTeamLead = persona === 'team-lead';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">My Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">{hackathon.title}</p>
      </div>

      {/* Persona-specific welcome */}
      <div className={cn(
        'rounded-xl border p-6',
        isEliminated ? 'bg-error/5 border-error/20' : isFinalist ? 'bg-warning/5 border-warning/20' : isTeamLead ? 'bg-accent/5 border-accent/20' : 'bg-gradient-to-br from-accent/10 to-accent-dim/5 border-border',
      )}>
        <div className="flex items-start gap-4 flex-wrap">
          {isEliminated && <Ban className="h-8 w-8 text-error" />}
          {isFinalist && <Award className="h-8 w-8 text-warning" />}
          {isTeamLead && <Shield className="h-8 w-8 text-accent" />}
          {persona === 'participant' && <User className="h-8 w-8 text-accent" />}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {isEliminated ? 'You were not promoted' : isFinalist ? 'Congratulations, Finalist!' : isTeamLead ? 'Team Dashboard' : `Welcome to ${hackathon.title}`}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {isEliminated && 'Your team was not selected for the next stage. Thank you for participating!'}
              {isFinalist && 'You have reached the final stage! Prepare your final submission.'}
              {isTeamLead && 'You can manage your team, send invitations, and view submissions.'}
              {persona === 'participant' && 'You are registered. Stay tuned for updates.'}
            </p>
          </div>
        </div>
      </div>

      {/* Team lead specific: team management card */}
      {isTeamLead && (
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Team Management</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Members</span><span className="font-medium">3 / {hackathon.maxTeamSize}</span></div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((m) => (
                <div key={m} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border-2 border-bg-surface text-xs font-medium text-accent">
                  U{m}
                </div>
              ))}
              <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border text-text-muted hover:text-accent ml-1">
                +
              </button>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 gap-1.5"><Users className="h-3.5 w-3.5" /> Invite Members</Button>
          </div>
        </div>
      )}

      {/* Finalist specific: celebration */}
      {isFinalist && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-5">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-warning shrink-0" />
            <div>
              <p className="font-medium text-text-primary">You are a Finalist!</p>
              <p className="text-sm text-text-muted">Prepare your final submission for the judging panel.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stage progress */}
      {stages.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <h3 className="font-semibold text-text-primary mb-3">Stage Progress</h3>
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const isCurrent = !isEliminated && !isFinalist && i === 0;
              const isCompleted = isFinalist && i < stages.length;
              const isLocked = isEliminated || (!isFinalist && i > 0);
              return (
                <div key={stage.id} className={cn('flex items-center gap-3', isLocked && 'opacity-50')}>
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                    isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-accent text-white' : 'bg-bg-elevated text-text-muted',
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stage.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{stage.name}</p>
                    <p className="text-xs text-text-muted">
                      {isCompleted && 'Completed'}
                      {isCurrent && 'Current stage'}
                      {isLocked && 'Locked'}
                    </p>
                  </div>
                  {isCurrent && <ArrowRight className="h-4 w-4 text-accent shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Team', value: isTeamLead ? 'Your Team' : isEliminated ? '—' : '—' },
          { label: 'Submissions', value: isEliminated ? '0' : isFinalist ? '1' : '0' },
          { label: 'Deadlines', value: stages.filter((s) => s.endDate).length.toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-bg-surface p-4 text-center">
            <p className="text-lg sm:text-xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
