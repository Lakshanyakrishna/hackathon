export interface Hackathon {
  id: string;
  title: string;
  slug: string;
  description: string;
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  location?: string | null;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'ARCHIVED';
  registrationFee: string;
  maxTeamSize: number;
  minTeamSize: number;
  allowSoloRegistration: boolean;
  approvalRequired: boolean;
  coverImage?: string | null;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageConfig {
  id: string;
  hackathonId: string;
  name: string;
  description?: string | null;
  order: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  requirements?: Record<string, unknown> | null;
  evaluationCriteria?: EvaluationCriterion[] | null;
  promotionRule?: PromotionRule | null;
  promotionExecuted: boolean;
  promotedAt?: string | null;
  promotedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCriterion {
  name: string;
  maxScore: number;
  description?: string;
}

export interface PromotionRule {
  type: 'TOP_N' | 'MINIMUM_SCORE' | 'MANUAL_SELECTION';
  value?: number;
}

export interface Rule {
  id: string;
  hackathonId: string;
  title: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prize {
  id: string;
  hackathonId: string;
  position: number;
  title?: string | null;
  amount: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemStatement {
  id: string;
  hackathonId: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  technologies: string[];
  resources: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  hackathonId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isActive: boolean;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
