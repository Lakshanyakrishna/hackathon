import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, Users, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/format';
import type { Hackathon } from '@/types/hackathon';

interface HackathonHeroProps {
  hackathon: Hackathon;
}

const statusStyles: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'error' | 'neutral' }> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  PUBLISHED: { label: 'Published', variant: 'success' },
  ONGOING: { label: 'Ongoing', variant: 'accent' },
  COMPLETED: { label: 'Completed', variant: 'neutral' },
  ARCHIVED: { label: 'Archived', variant: 'neutral' },
};

export function HackathonHero({ hackathon }: HackathonHeroProps) {
  const statusStyle = statusStyles[hackathon.status] ?? { label: hackathon.status, variant: 'neutral' as const };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-bg-surface to-pink/10"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-pink/10 blur-[80px]" />
      </div>

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant={statusStyle.variant} size="lg">{statusStyle.label}</Badge>
          <Badge variant="accent" size="sm">{hackathon.mode}</Badge>
        </div>

        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
          {hackathon.title}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          {hackathon.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Calendar className="h-4 w-4 text-accent" />
            <span>{formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}</span>
          </div>
          {hackathon.location && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{hackathon.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <DollarSign className="h-4 w-4 text-accent" />
            <span>${parseFloat(hackathon.registrationFee).toFixed(2)} fee</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Team Size</p>
              <p className="text-sm font-medium text-text-primary">
                {hackathon.minTeamSize}–{hackathon.maxTeamSize}
                {hackathon.allowSoloRegistration ? ' (solo ok)' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Registration</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(hackathon.registrationStartDate)} – {formatDate(hackathon.registrationEndDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Approval</p>
              <p className="text-sm font-medium text-text-primary">
                {hackathon.approvalRequired ? 'Required' : 'Not required'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
