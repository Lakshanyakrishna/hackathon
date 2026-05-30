import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface RequirementField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: Record<string, unknown>;
}

interface DynamicSubmissionFormProps {
  requirements: RequirementField[];
  initialData: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  isSubmitting: boolean;
  readOnly?: boolean;
}

function validateField(field: RequirementField, value: unknown): string | null {
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label} is required`;
  }
  if (value === undefined || value === null || value === '') return null;

  const val = String(value);
  switch (field.type) {
    case 'url': {
      try { new URL(val); return null; } catch { return 'Invalid URL format'; }
    }
    case 'number': {
      if (isNaN(Number(val))) return 'Must be a number';
      const min = field.validation?.min as number | undefined;
      const max = field.validation?.max as number | undefined;
      const num = Number(val);
      if (min !== undefined && num < min) return `Minimum value is ${min}`;
      if (max !== undefined && num > max) return `Maximum value is ${max}`;
      return null;
    }
    case 'text': {
      const minLen = field.validation?.minLength as number | undefined;
      const maxLen = field.validation?.maxLength as number | undefined;
      if (minLen !== undefined && val.length < minLen) return `Minimum ${minLen} characters`;
      if (maxLen !== undefined && val.length > maxLen) return `Maximum ${maxLen} characters`;
      return null;
    }
    default: return null;
  }
}

export function DynamicSubmissionForm({
  requirements,
  initialData,
  onDataChange,
  onSave,
  isSaving,
  lastSaved,
  isSubmitting,
  readOnly = false,
}: DynamicSubmissionFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...initialData });
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const dataRef = useRef(formData);
  dataRef.current = formData;

  const handleChange = useCallback((key: string, value: unknown) => {
    const next = { ...dataRef.current, [key]: value };
    setFormData(next);
    onDataChange(next);
    setTouched((prev) => new Set(prev).add(key));
  }, [onDataChange]);

  const handleBlur = useCallback((field: RequirementField) => {
    const error = validateField(field, formData[field.key]);
    setErrors((prev) => ({ ...prev, [field.key]: error }));
  }, [formData]);

  const completedCount = requirements.filter((req) => {
    const val = formData[req.key];
    return val !== undefined && val !== null && val !== '';
  }).length;

  const errorsList = Object.values(errors).filter(Boolean) as string[];
  const hasErrors = errorsList.length > 0;
  const hasRequired = requirements.filter((r) => r.required).length;
  const completedRequired = requirements.filter((r) => r.required && formData[r.key] !== undefined && formData[r.key] !== null && formData[r.key] !== '').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted">
            {completedCount}/{requirements.length} fields
          </span>
          {completedCount === requirements.length && !hasErrors && (
            <Badge variant="success" size="sm">Complete</Badge>
          )}
          {hasErrors && <Badge variant="error" size="sm">{errorsList.length} error{errorsList.length > 1 ? 's' : ''}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onSave}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save Draft
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            hasErrors ? 'bg-error' : 'bg-gradient-to-r from-accent to-pink',
          )}
          style={{ width: `${(completedCount / requirements.length) * 100}%` }}
        />
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {requirements.map((field, i) => {
          const val = formData[field.key];
          const error = touched.has(field.key) ? errors[field.key] : null;
          const hasValue = val !== undefined && val !== null && val !== '';

          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn('space-y-1.5', readOnly && 'opacity-90')}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                {field.label}
                {field.required && <span className="text-error">*</span>}
                {!field.required && <span className="text-xs text-text-muted font-normal">(optional)</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={(val as string) ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  disabled={readOnly}
                  rows={4}
                  className={cn(
                    'w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error ? 'border-error' : 'border-border hover:border-border-hover',
                  )}
                />
              ) : field.type === 'boolean' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!val}
                    onChange={(e) => handleChange(field.key, e.target.checked)}
                    onBlur={() => handleBlur(field)}
                    disabled={readOnly}
                    className="h-4 w-4 rounded border-border bg-bg-surface text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-text-secondary">{field.placeholder || 'Yes / No'}</span>
                </label>
              ) : field.type === 'number' ? (
                <Input
                  type="number"
                  value={(val as string) ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  error={error ?? undefined}
                  disabled={readOnly}
                />
              ) : field.type === 'file' ? (
                <div className="rounded-md border border-dashed border-border bg-bg-elevated/50 p-4 text-center">
                  <p className="text-sm text-text-muted">File upload placeholder</p>
                  <p className="text-xs text-text-muted mt-1">{hasValue ? 'File selected' : 'No file uploaded'}</p>
                </div>
              ) : (
                <Input
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={(val as string) ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder={field.placeholder}
                  error={error ?? undefined}
                  disabled={readOnly}
                />
              )}

              {error && <p className="text-xs text-error">{error}</p>}
            </motion.div>
          );
        })}
      </div>

      {/* Validation summary */}
      {touched.size > 0 && (hasErrors || completedRequired < hasRequired) && (
        <div className="rounded-lg bg-warning/5 p-3 text-sm">
          <p className="font-medium text-warning mb-1">Submission not ready</p>
          <ul className="space-y-0.5 text-text-muted">
            {hasRequired > 0 && completedRequired < hasRequired && (
              <li>• {hasRequired - completedRequired} required field{(hasRequired - completedRequired) > 1 ? 's' : ''} not filled</li>
            )}
            {errorsList.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
