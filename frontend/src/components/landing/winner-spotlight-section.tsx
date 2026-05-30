import { motion } from 'framer-motion';
import { Quote, Trophy, ExternalLink } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function WinnerSpotlightSection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Winner&apos;s Story</h2>
        <p className="mt-3 text-lg text-text-muted">From idea to victory — a hackathon journey</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/5 via-bg-surface to-pink/5"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/5 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-pink/5 blur-[80px]" />
        </div>

        <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-warning/10 p-2">
                <Trophy className="h-5 w-5 text-warning" />
              </div>
              <Badge variant="gradient" size="lg">Grand Prize Winner</Badge>
            </div>

            <h3 className="text-2xl font-bold text-text-primary sm:text-3xl">EcoTrack</h3>
            <p className="mt-1 text-base text-accent font-medium">AI Hackathon 2026</p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                <Avatar name="Sarah" size="md" />
                <Avatar name="Mike" size="md" />
                <Avatar name="Priya" size="md" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Team GreenFuture</p>
                <p className="text-xs text-text-muted">Sarah, Mike, Priya</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2">
                <Quote className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm leading-relaxed text-text-secondary italic">
                  We built EcoTrack in 48 hours during the AI Hackathon. The platform&apos;s
                  stage-based format kept us focused, and the clear evaluation criteria helped us
                  prioritize what mattered. Winning was incredible, but the journey through each
                  stage taught us more than any classroom ever could.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="accent" size="sm">Python</Badge>
                <Badge variant="accent" size="sm">TensorFlow</Badge>
                <Badge variant="accent" size="sm">React</Badge>
                <Badge variant="accent" size="sm">AWS</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-warning" />
                  Prize: $10,000
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-bg-elevated/50 p-8 text-center">
              <div className="mb-4 text-5xl">🏆</div>
              <p className="text-sm font-medium text-text-primary">Grand Prize</p>
              <p className="text-3xl font-bold text-text-primary mt-1">$10,000</p>
              <p className="mt-1 text-xs text-text-muted">AI Hackathon 2026</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 gap-1"
                onClick={() => navigate('/hackathons')}
              >
                View Hackathon <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
