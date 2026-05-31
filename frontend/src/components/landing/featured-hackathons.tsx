import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { hackathonService } from '@/services/hackathons';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate, daysRemaining } from '@/utils/format';
import { unwrapData } from '@/utils/unwrap-data';
import type { Hackathon } from '@/types/hackathon';

function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
  const daysLeft = daysRemaining(hackathon.registrationDeadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/hackathons/${hackathon.slug}`} className="block">
        <Card className="group p-5 cursor-pointer transition-all hover:border-accent/40 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={hackathon.status === 'ONGOING' ? 'success' : 'info'} size="sm">
                  {hackathon.status === 'ONGOING' ? 'Live' : 'Upcoming'}
                </Badge>
                {daysLeft > 0 && hackathon.status !== 'ONGOING' && (
                  <span className="text-xs text-text-muted">Closes in {daysLeft}d</span>
                )}
              </div>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                {hackathon.title}
              </h3>
              <p className="text-sm text-text-muted mt-1 line-clamp-2">{hackathon.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {hackathon.mode === 'ONLINE' ? 'Online' : hackathon.mode}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {hackathon.minTeamSize}–{hackathon.maxTeamSize}/team
                </span>
              </div>
            </div>
            <div className="shrink-0 text-text-muted group-hover:text-accent transition-colors mt-1">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function FeaturedHackathons() {
  const { data, isLoading } = useQuery({
    queryKey: ['hackathons', 'featured'],
    queryFn: () => hackathonService.list({ limit: '10' }).then(r => unwrapData<Hackathon[]>(r)),
  });

  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Announcements</h2>
        <p className="mt-1.5 text-sm text-text-muted">Featured hackathons and upcoming events.</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.slice(0, 5).map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      ) : (
        <EmptyState title="No events yet" description="Check back soon for upcoming hackathons." />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-8 text-center"
      >
        <Link to="/hackathons">
          <Button variant="outline" size="sm" className="gap-1.5">
            View All Events <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
