import { motion } from 'framer-motion';
import {
  LayoutDashboard, ArrowUpDown, FileText, Award, BarChart3, Megaphone,
  Search, UserPlus, Upload, Trophy, Users, CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const organizerFeatures = [
  { icon: LayoutDashboard, label: 'Workspace', desc: 'Full hackathon management dashboard with real-time metrics' },
  { icon: ArrowUpDown, label: 'Multi-stage Workflows', desc: 'Configurable stages with promotion rules and evaluation criteria' },
  { icon: FileText, label: 'Problem Statements', desc: 'Publish challenges, resources, and acceptance criteria' },
  { icon: Award, label: 'Prizes & Winners', desc: 'Configure prize pools and announce winners' },
  { icon: BarChart3, label: 'Analytics', desc: 'Conversion funnel, registration trends, and submission stats' },
  { icon: Megaphone, label: 'Announcements', desc: 'Broadcast updates, pin important messages' },
];

const participantFeatures = [
  { icon: Search, label: 'Discover', desc: 'Browse hackathons by status, mode, and team size' },
  { icon: UserPlus, label: 'Team Up', desc: 'Create teams, invite members, manage invitations' },
  { icon: Upload, label: 'Submit Work', desc: 'Stage-based submissions with auto-save and version history' },
  { icon: Trophy, label: 'Win Prizes', desc: 'Compete for cash prizes, mentorship, and recognition' },
  { icon: Users, label: 'Collaborate', desc: 'Work with your team across all stages' },
  { icon: CheckCircle, label: 'Track Progress', desc: 'View scores, promotion status, and deadlines' },
];

export function PlatformShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center"
      >
        <Badge variant="accent" size="sm" className="mb-3">Platform</Badge>
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Built for organizers and participants
        </h2>
        <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
          Everything you need to run a seamless hackathon or compete at your best — in one platform.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* For Organizers */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <LayoutDashboard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">For Organizers</h3>
              <p className="text-sm text-text-muted">Manage every aspect of your hackathon</p>
            </div>
          </div>
          <div className="space-y-3">
            {organizerFeatures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 flex items-start gap-3 hover:border-accent/30 transition-colors">
                  <div className="rounded-md bg-accent/5 p-2 shrink-0">
                    <f.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{f.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* For Participants */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">For Participants</h3>
              <p className="text-sm text-text-muted">Compete, collaborate, and showcase your skills</p>
            </div>
          </div>
          <div className="space-y-3">
            {participantFeatures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 flex items-start gap-3 hover:border-accent/30 transition-colors">
                  <div className="rounded-md bg-accent/5 p-2 shrink-0">
                    <f.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{f.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
