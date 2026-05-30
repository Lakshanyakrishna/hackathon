import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EvaluationCriterion } from '@/types/hackathon';

interface EvaluationCriteriaBuilderProps {
  value: EvaluationCriterion[];
  onChange: (value: EvaluationCriterion[]) => void;
}

export function EvaluationCriteriaBuilder({ value, onChange }: EvaluationCriteriaBuilderProps) {
  const addCriterion = () => {
    onChange([...value, { name: '', maxScore: 10, description: '' }]);
  };

  const removeCriterion = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: Partial<EvaluationCriterion>) => {
    onChange(value.map((c, i) => (i === index ? { ...c, ...field } : c)));
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

  const totalMaxScore = value.reduce((sum, c) => sum + c.maxScore, 0);

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>{value.length} criteria</span>
          <span>Total max score: {totalMaxScore}</span>
        </div>
      )}
      {value.length === 0 && (
        <p className="text-sm text-text-muted italic py-2">No evaluation criteria defined.</p>
      )}
      {value.map((criterion, i) => (
        <Card key={i} className="p-3 border-border">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 mt-1">
              <button onClick={() => moveUp(i)} aria-label="Move up" className="text-text-muted hover:text-text-primary p-0.5 disabled:opacity-30" disabled={i === 0}><ChevronUp className="h-3 w-3" /></button>
              <button onClick={() => moveDown(i)} aria-label="Move down" className="text-text-muted hover:text-text-primary p-0.5 disabled:opacity-30" disabled={i === value.length - 1}><ChevronDown className="h-3 w-3" /></button>
            </div>
            <div className="flex-1 space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  value={criterion.name}
                  onChange={(e) => updateCriterion(i, { name: e.target.value })}
                  placeholder="Criteria name"
                  className="h-8 text-xs"
                />
                <Input
                  value={criterion.maxScore}
                  onChange={(e) => updateCriterion(i, { maxScore: Number(e.target.value) })}
                  placeholder="Max score"
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => removeCriterion(i)} aria-label="Delete" className="p-1 text-text-muted hover:text-error transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <Textarea
                value={criterion.description ?? ''}
                onChange={(e) => updateCriterion(i, { description: e.target.value })}
                placeholder="Description of what this criterion evaluates..."
                className="min-h-[40px] text-xs"
              />
            </div>
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={addCriterion}>
        <Plus className="h-4 w-4" /> Add Criterion
      </Button>
    </div>
  );
}
