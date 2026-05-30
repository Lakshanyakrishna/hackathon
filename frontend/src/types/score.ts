export interface Score {
  id: string;
  organizerId: string;
  teamId: string;
  stageId?: string | null;
  criteriaScores?: Record<string, number> | null;
  total: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  organizer?: { id: string; name: string; email: string };
  team?: { id: string; name: string };
  stage?: {
    id: string;
    name: string;
    order: number;
    evaluationCriteria?: Record<string, unknown> | null;
  };
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  averageScore: number;
  stageMaxScore: number;
  stagePercentage: number;
  organizerScoreCount: number;
}

export interface OverallLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  overallPercentage: number;
  stagesScored: number;
}
