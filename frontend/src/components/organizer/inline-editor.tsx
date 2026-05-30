import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InlineEditorProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  label?: string;
}

export function InlineEditor({ value, onSave, placeholder, multiline, className, label }: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = useCallback(async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  if (!editing) {
    return (
      <div className={cn('group flex items-center gap-1.5', className)}>
        <span className={cn(
          'text-sm transition-colors',
          value ? 'text-text-primary' : 'text-text-muted italic',
        )}>
          {value || placeholder || 'Click to edit...'}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-text-muted hover:text-accent hover:bg-accent/5 transition-all"
          title={label ? `Edit ${label}` : 'Edit'}
        >
          <Edit3 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-1', className)}>
      {multiline ? (
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] w-full rounded-md border border-accent bg-bg-surface px-2 py-1 text-sm text-text-primary outline-none resize-y"
          placeholder={placeholder}
        />
      ) : (
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-full rounded-md border border-accent bg-bg-surface px-2 text-sm text-text-primary outline-none"
          placeholder={placeholder}
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md p-1 text-success hover:bg-success/5 transition-colors disabled:opacity-50"
        title="Save"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={handleCancel}
        className="rounded-md p-1 text-error hover:bg-error/5 transition-colors"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
