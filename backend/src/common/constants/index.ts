export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const SUBMISSION_STAGES = {
  STAGE_1: 'STAGE_1',
  STAGE_2: 'STAGE_2',
  STAGE_3: 'STAGE_3',
} as const;

export const TEAM_ROLES = {
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
} as const;

export const SCORE_CATEGORIES = ['innovation', 'technical', 'uiux', 'presentation'] as const;
export const MAX_SCORE_PER_CATEGORY = 10;
