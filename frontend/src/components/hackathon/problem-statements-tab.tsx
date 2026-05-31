import { motion } from 'framer-motion';
import { Lightbulb, ExternalLink, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProblemStatement } from '@/types/hackathon';

interface ProblemStatementsTabProps {
  statements: ProblemStatement[];
}

const difficultyColors: Record<string, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

export function ProblemStatementsTab({ statements }: ProblemStatementsTabProps) {
  if (statements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Lightbulb className="h-12 w-12 text-text-muted mb-3" />
        <h3 className="font-semibold text-text-primary">No Problem Statements</h3>
        <p className="mt-1 text-sm text-text-muted">Problem statements will be published soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statements.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-text-primary">{s.title}</h4>
                  <Badge variant={difficultyColors[s.difficulty] ?? 'neutral'} size="sm">
                    {s.difficulty}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">{s.description}</p>
                {s.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.technologies.map((tech) => (
                      <Badge key={tech} variant="accent" size="sm">{tech}</Badge>
                    ))}
                  </div>
                )}
                {s.resources.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {s.resources.map((r, ri) => (
                      <a
                        key={ri}
                        href={r}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <BookOpen className="h-3 w-3" />
                        Resource {ri + 1}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
