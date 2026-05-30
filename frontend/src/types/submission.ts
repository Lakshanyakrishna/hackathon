export interface Submission {
  id: string;
  teamId: string;
  hackathonId: string;
  stageId: string;
  version: number;
  data?: Record<string, unknown> | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'LOCKED';
  submittedAt?: string | null;
  submittedBy?: string | null;
  previousVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
  stage?: {
    id: string;
    name: string;
    order: number;
    requirements?: Record<string, unknown> | null;
  };
  team?: { id: string; name: string };
}

export interface SubmissionPreview {
  id: string;
  teamId: string;
  teamName: string;
  stageId: string;
  stageName: string;
  status: string;
  version: number;
  fields: SubmissionField[];
  submittedAt?: string | null;
}

export interface SubmissionField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: Record<string, unknown>;
  value?: unknown;
}
