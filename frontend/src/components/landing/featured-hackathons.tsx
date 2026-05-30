import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { hackathonService } from '@/services/hackathons';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, daysRemaining } from '@/utils/format';
import type { Hackathon } from '@/types/hackathon';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  PUBLISHED: 'info',
  ONGOING: 'success',
  COMPLETED: 'neutral',
  DRAFT: 'neutral',
  ARCHIVED: 'neutral',
};

function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
  const daysLeft = daysRemaining(hackathon.registrationEndDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/hackathons/${hackathon.slug}`}>
        <Card className="group h-full cursor-pointer transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
          <div className="flex h-full flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {hackathon.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="h-4 w-4" />
                  {formatDate(hackathon.startDate)} — {formatDate(hackathon.endDate)}
                </div>
              </div>
              <Badge variant={statusBadge[hackathon.status] || 'neutral'}>
                {hackathon.status === 'ONGOING' ? 'Live' : hackathon.status === 'PUBLISHED' ? 'Upcoming' : hackathon.status}
              </Badge>
            </div>

            <p className="line-clamp-2 text-sm text-text-secondary flex-1">
              {hackathon.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              {hackathon.mode && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hackathon.mode === 'ONLINE' ? 'Online' : hackathon.mode}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Max {hackathon.maxTeamSize}/team
              </span>
              {hackathon.registrationFee && parseFloat(hackathon.registrationFee) > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {parseFloat(hackathon.registrationFee).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {daysLeft > 0 && hackathon.status === 'PUBLISHED' && (
              <div className="text-xs text-warning">
                Registration closes in {daysLeft} days
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function FeaturedHackathons() {
  const { data, isLoading } = useQuery({
    queryKey: ['hackathons', 'featured'],
    queryFn: () => hackathonService.list({ limit: '6' }).then(r => r.data),
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 text-center"
      >
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Featured Hackathons</h2>
        <p className="mt-3 text-lg text-text-muted">
          Find your next challenge and start building
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border bg-bg-surface p-6">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.slice(0, 6).map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      ) : (
        <div className="text-center text-text-muted py-12">
          <p>No hackathons available yet. Be the first to create one!</p>
          <Link to="/auth/signup">
            <Button variant="primary" className="mt-4">Get Started</Button>
          </Link>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center"
      >
        <Link to="/hackathons">
          <Button variant="outline" size="lg">
            View All Hackathons
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
