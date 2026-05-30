import { motion } from 'framer-motion';
import { Megaphone, Pin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { Announcement } from '@/types/hackathon';

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

export function AnnouncementsTab({ announcements }: AnnouncementsTabProps) {
  const sorted = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Megaphone className="h-12 w-12 text-text-muted mb-3" />
        <h3 className="font-semibold text-text-primary">No Announcements</h3>
        <p className="mt-1 text-sm text-text-muted">Announcements will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className={cn('p-5', a.isPinned && 'border-accent/30 bg-accent/[0.02]')}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                a.isPinned ? 'bg-accent/10' : 'bg-bg-elevated',
              )}>
                {a.isPinned ? (
                  <Pin className="h-4 w-4 text-accent" />
                ) : (
                  <Megaphone className="h-4 w-4 text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-text-primary">{a.title}</h4>
                  {a.isPinned && <Badge variant="accent" size="sm">Pinned</Badge>}
                </div>
                <p className="mt-1 text-sm text-text-muted">{a.content}</p>
                <p className="mt-2 text-xs text-text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
