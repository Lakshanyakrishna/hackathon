import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import type { StageConfig } from '@/types/hackathon';

interface PreviewField {
  key: string;
  label: string;
  type: string;
  value: unknown;
  required: boolean;
}

interface SubmissionPreviewProps {
  fields: PreviewField[];
  stage: StageConfig;
  teamName: string;
  deadline?: string | null;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function SubmissionPreview({
  fields,
  stage,
  teamName,
  deadline,
  onConfirm,
  onBack,
  isSubmitting,
}: SubmissionPreviewProps) {
  const filled = fields.filter((f) => f.value !== undefined && f.value !== null && f.value !== '').length;
  const requiredFields = fields.filter((f) => f.required);
  const filledRequired = requiredFields.filter((f) => f.value !== undefined && f.value !== null && f.value !== '').length;
  const allRequiredFilled = filledRequired === requiredFields.length;

  const formatValue = (field: PreviewField): string => {
    if (field.value === undefined || field.value === null || field.value === '') return '—';
    if (field.type === 'boolean') return field.value ? 'Yes' : 'No';
    if (field.type === 'url') return String(field.value);
    return String(field.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Preview Submission</h2>
            <p className="text-sm text-text-muted mt-1">
              {teamName} · Stage {stage.order}: {stage.name}
            </p>
          </div>
          {deadline && (
            <div className="flex items-center gap-1.5 text-sm text-warning">
              <Clock className="h-4 w-4" />
              Due {new Date(deadline).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {fields.map((field, i) => (
            <div
              key={field.key}
              className={cn(
                'rounded-lg p-4 border',
                field.value !== undefined && field.value !== null && field.value !== ''
                  ? 'border-accent/20 bg-accent/[0.02]'
                  : 'border-border bg-bg-elevated/30',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {field.value !== undefined && field.value !== null && field.value !== '' ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-text-muted shrink-0" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{field.label}</span>
                    {field.required && <span className="text-xs text-error">*</span>}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary ml-6 break-all">
                    {formatValue(field)}
                  </p>
                </div>
                <Badge variant={field.value && field.value !== '' ? 'success' : 'default'} size="sm">
                  {field.value && field.value !== '' ? 'Set' : 'Missing'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-bg-elevated">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-text-muted" />
            <span className="text-text-muted">Completion:</span>
            <span className="font-medium text-text-primary">{filled}/{fields.length}</span>
            {allRequiredFilled ? (
              <Badge variant="success" size="sm">All required fields set</Badge>
            ) : (
              <Badge variant="warning" size="sm">{requiredFields.length - filledRequired} required missing</Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          Back to Edit
        </Button>
        <Button
          className="flex-1 gap-2 bg-gradient-to-r from-accent to-pink hover:opacity-90"
          disabled={!allRequiredFilled || isSubmitting}
          onClick={onConfirm}
        >
          {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
        </Button>
      </div>
    </motion.div>
  );
}
