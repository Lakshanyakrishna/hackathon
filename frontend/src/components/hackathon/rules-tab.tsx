import { motion } from 'framer-motion';
import { Scale, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Rule } from '@/types/hackathon';

interface RulesTabProps {
  rules: Rule[];
}

export function RulesTab({ rules }: RulesTabProps) {
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Scale className="h-12 w-12 text-text-muted mb-3" />
        <h3 className="font-semibold text-text-primary">No Rules Published</h3>
        <p className="mt-1 text-sm text-text-muted">Rules will be added by the admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <motion.div
          key={rule.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="flex items-start gap-3 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/5">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-text-primary">{rule.title}</h4>
              {rule.description && (
                <p className="mt-1 text-sm text-text-muted">{rule.description}</p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
