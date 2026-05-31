import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Globe, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { hackathonService } from '@/services/hackathons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Input } from '@/components/ui/input';
import type { Hackathon } from '@/types/hackathon';
import { unwrapData } from '@/utils/unwrap-data';

const statusBadge = (s: string) =>
  s === 'PUBLISHED' ? 'success' as const : s === 'ONGOING' ? 'accent' as const : s === 'COMPLETED' ? 'neutral' as const : 'warning' as const;

export function HackathonListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: hackathons, isLoading, isError, refetch } = useQuery({
    queryKey: ['hackathons', 'public'],
    queryFn: () => hackathonService.list({ status: 'PUBLISHED' }).then((r) => unwrapData<Hackathon[]>(r)),
  });

  const list = (hackathons ?? []).filter((h) =>
    !search || h.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Hackathons</h1>
        <ErrorState
          title="Failed to load hackathons"
          message="Could not load hackathons. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Hackathons</h1>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search hackathons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title={search ? 'No matching hackathons' : 'No hackathons available'}
          description={search ? 'Try a different search term.' : 'Check back later for upcoming hackathons.'}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-accent/30 group h-full flex flex-col"
                onClick={() => navigate(`/hackathons/${h.slug}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2 text-lg">{h.title}</h3>
                  <Badge variant={statusBadge(h.status)} size="sm" className="shrink-0">{h.status}</Badge>
                </div>
                <p className="text-sm text-text-muted line-clamp-3 mb-4 flex-1">{h.description}</p>
                <div className="space-y-2 text-sm text-text-muted mt-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{h.minTeamSize}–{h.maxTeamSize} members · {h.registrationMode === 'OPEN' ? 'Open' : 'Approval'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.mode === 'OFFLINE' ? <MapPin className="h-4 w-4 shrink-0" /> : <Globe className="h-4 w-4 shrink-0" />}
                    <span className="capitalize">{h.mode.toLowerCase()}</span>
                    {Number(h.registrationFee) > 0 && <span>· ₹{h.registrationFee}</span>}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
