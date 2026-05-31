import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, ChevronRight, Clock, Calendar, Star, CheckCircle2 } from 'lucide-react';
import type { StageConfig, RequirementField } from '@/types/hackathon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface StagePipelineProps {
  stages: StageConfig[];
  onCreate: () => void;
  onEdit: (stage: StageConfig) => void;
  onDelete: (stage: StageConfig) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function StagePipeline({ stages, onCreate, onEdit, onDelete, onMoveUp, onMoveDown }: StagePipelineProps) {
  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border py-16">
        <div className="rounded-full bg-accent/5 p-4">
          <Settings className="h-8 w-8 text-accent" />
        </div>
        <p className="text-lg font-medium text-text-primary">No stages yet</p>
        <p className="text-sm text-text-muted max-w-xs text-center">Create your first stage to define the hackathon flow. Stages are the building blocks of your event.</p>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Create First Stage
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{stages.length} stage{stages.length !== 1 && 's'} in pipeline</p>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Add Stage
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          <AnimatePresence>
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                layout
                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={cn(
                  'relative flex w-72 shrink-0 flex-col rounded-xl border bg-bg-surface p-4 shadow-sm transition-shadow hover:shadow-md',
                  !stage.isActive && 'opacity-60',
                  stage.promotionExecuted && 'border-accent/30',
                )}
              >
                {/* Order badge */}
                <div className={cn(
                  'absolute -top-2.5 -left-2.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm',
                  stage.isActive ? 'bg-accent' : 'bg-text-muted',
                )}>
                  {stage.order}
                </div>

                {/* Reorder arrows */}
                <div className="absolute -top-2.5 right-2 flex gap-0.5">
                  {index > 0 && (
                    <button onClick={() => onMoveUp(index)} className="flex h-5 w-5 items-center justify-center rounded bg-bg-elevated text-text-muted hover:text-text-primary text-xs">
                      ↑
                    </button>
                  )}
                  {index < stages.length - 1 && (
                    <button onClick={() => onMoveDown(index)} className="flex h-5 w-5 items-center justify-center rounded bg-bg-elevated text-text-muted hover:text-text-primary text-xs">
                      ↓
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-3">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-text-primary text-sm truncate">{stage.name}</h4>
                      <Badge variant={stage.isActive ? 'success' : 'neutral'} size="sm">
                        {stage.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {stage.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{stage.description}</p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-text-muted">
                    {stage.startDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>From {new Date(stage.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {stage.endDate && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>Until {new Date(stage.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {!stage.startDate && !stage.endDate && (
                      <span className="italic">No date set</span>
                    )}
                  </div>

                  {/* Stats chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {(stage.requirements as RequirementField[])?.length ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/5 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <FileTextIcon className="h-2.5 w-2.5" />
                        {(stage.requirements as RequirementField[]).length} req
                      </span>
                    ) : null}
                    {(stage.evaluationCriteria as Array<unknown>)?.length ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/5 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <Star className="h-2.5 w-2.5" />
                        {(stage.evaluationCriteria as Array<unknown>).length} criteria
                      </span>
                    ) : null}
                    {stage.promotionRule && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/5 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {stage.promotionRule.type}
                      </span>
                    )}
                  </div>

                  {/* Promotion badge */}
                  {stage.promotionExecuted && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-success/5 p-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      <span className="text-xs text-success font-medium">Promotion executed</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => onEdit(stage)}>
                      <Settings className="h-3 w-3 mr-1" /> Configure
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-error hover:text-error" onClick={() => onDelete(stage)}>
                      ×
                    </Button>
                  </div>
                </div>

                {/* Connector arrow to next stage */}
                {index < stages.length - 1 && (
                  <div className="absolute -right-[18px] top-1/2 z-10 -translate-y-1/2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-bg-surface shadow-sm">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
