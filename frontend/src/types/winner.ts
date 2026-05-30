export interface Winner {
  id: string;
  hackathonId: string;
  teamId: string;
  awardTitle: string;
  prizeId?: string | null;
  createdAt: string;
  team: {
    id: string;
    name: string;
    members?: Array<{
      id: string;
      userId: string;
      user: { id: string; name: string; avatar?: string | null };
    }>;
  };
  prize?: {
    id: string;
    title?: string | null;
    amount: string;
  } | null;
}
