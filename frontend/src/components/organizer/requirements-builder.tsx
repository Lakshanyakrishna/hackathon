import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type RequirementField } from '@/types/hackathon';

interface RequirementsBuilderProps {
  value: RequirementField[];
  onChange: (value: RequirementField[]) => void;
}

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'URL', value: 'url' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'File', value: 'file' },
];

export function RequirementsBuilder({ value, onChange }: RequirementsBuilderProps) {
  const addField = () => {
    const key = `field_${Date.now()}`;
    onChange([...value, { key, label: '', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: Partial<RequirementField>) => {
    onChange(value.map((f, i) => (i === index ? { ...f, ...field } : f)));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...value];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onChange(arr);
  };

  const moveDown = (index: number) => {
    if (index >= value.length - 1) return;
    const arr = [...value];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-text-muted italic py-2">No fields defined. Add a field below.</p>
      )}
      {value.map((field, i) => (
        <Card key={i} className="p-3 border-border">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 mt-1">
              <button onClick={() => moveUp(i)} aria-label="Move up" className="text-text-muted hover:text-text-primary p-0.5 disabled:opacity-30" disabled={i === 0}><ChevronUp className="h-3 w-3" /></button>
              <button onClick={() => moveDown(i)} aria-label="Move down" className="text-text-muted hover:text-text-primary p-0.5 disabled:opacity-30" disabled={i === value.length - 1}><ChevronDown className="h-3 w-3" /></button>
            </div>
            <div className="flex-1 grid gap-2 sm:grid-cols-4">
              <Input
                value={field.key}
                onChange={(e) => updateField(i, { key: e.target.value })}
                placeholder="Field key"
                className="h-8 text-xs font-mono"
              />
              <Input
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Display label"
                className="h-8 text-xs"
              />
              <Select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value })}
                options={FIELD_TYPES}
                className="h-8 text-xs"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-text-secondary">Required</span>
                </label>
                <button onClick={() => removeField(i)} aria-label="Delete" className="ml-auto p-1 text-text-muted hover:text-error transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
          {field.type === 'text' || field.type === 'textarea' ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 ml-7">
              <Input
                value={field.placeholder ?? ''}
                onChange={(e) => updateField(i, { placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="h-7 text-xs"
              />
              <div className="flex gap-2">
                <Input
                  value={field.validation?.minLength?.toString() ?? ''}
                  onChange={(e) => updateField(i, { validation: { ...field.validation, minLength: e.target.value ? Number(e.target.value) : undefined } })}
                  placeholder="Min length"
                  type="number"
                  className="h-7 text-xs"
                />
                <Input
                  value={field.validation?.maxLength?.toString() ?? ''}
                  onChange={(e) => updateField(i, { validation: { ...field.validation, maxLength: e.target.value ? Number(e.target.value) : undefined } })}
                  placeholder="Max length"
                  type="number"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          ) : field.type === 'number' ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 ml-7">
              <Input
                value={field.validation?.min?.toString() ?? ''}
                onChange={(e) => updateField(i, { validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined } })}
                placeholder="Min value"
                type="number"
                className="h-7 text-xs"
              />
              <Input
                value={field.validation?.max?.toString() ?? ''}
                onChange={(e) => updateField(i, { validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined } })}
                placeholder="Max value"
                type="number"
                className="h-7 text-xs"
              />
            </div>
          ) : null}
        </Card>
      ))}
      <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={addField}>
        <Plus className="h-4 w-4" /> Add Field
      </Button>
    </div>
  );
}
