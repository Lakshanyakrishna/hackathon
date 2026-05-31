import { motion } from 'framer-motion';
import {
  ArrowRight,
  CreditCard,
  Clock,
  Users,
  Lock,
  Upload,
  Eye,
  Rocket,
  Search,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { NextAction } from '@/types/dashboard';

const actionIcons: Record<string, React.ElementType> = {
  BROWSE_HACKATHONS: Search,
  COMPLETE_PAYMENT: CreditCard,
  AWAITING_APPROVAL: Clock,
  FORM_TEAM: Users,
  JOIN_TEAM: Users,
  LOCK_TEAM: Lock,
  SUBMIT_STAGE: Upload,
  AWAITING_REVIEW: Eye,
  START_NEXT_STAGE: Rocket,
  COMPLETED: CheckCircle2,
};

const actionGradients: Record<string, string> = {
  BROWSE_HACKATHONS: 'from-accent/20 to-navy-dark/10',
  COMPLETE_PAYMENT: 'from-warning/20 to-orange-500/10',
  AWAITING_APPROVAL: 'from-accent/10 to-navy-dark/10',
  FORM_TEAM: 'from-accent/20 to-pink/10',
  JOIN_TEAM: 'from-accent/20 to-pink/10',
  LOCK_TEAM: 'from-accent/15 to-navy-dark/10',
  SUBMIT_STAGE: 'from-accent/20 to-pink/10',
  AWAITING_REVIEW: 'from-accent/10 to-navy-dark/10',
  START_NEXT_STAGE: 'from-accent/20 to-pink/15',
  COMPLETED: 'from-success/20 to-green-500/10',
};

interface NextActionCardProps {
  action: NextAction;
}

export function NextActionCard({ action }: NextActionCardProps) {
  const Icon = actionIcons[action.type] ?? ArrowRight;

  if (action.type === 'COMPLETED') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden border-accent/30 bg-gradient-to-br ${actionGradients[action.type] ?? 'from-accent/10 to-navy-dark/10'}`}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-[60px]" />
        </div>

        <div className="relative flex items-start gap-4 p-5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dim`}>
            <Icon className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary">Next Action</h3>
              {action.isUrgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Urgent
                </span>
              )}
            </div>
            <p className="mt-1 text-xl font-bold text-text-primary">{action.label}</p>
            <p className="mt-0.5 text-sm text-text-muted">{action.description}</p>

            {action.href && (
              <Button
                size="sm"
                className="mt-3 gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90"
                onClick={() => window.location.href = action.href!}
              >
                {action.type === 'SUBMIT_STAGE' ? 'Go to Submission' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
