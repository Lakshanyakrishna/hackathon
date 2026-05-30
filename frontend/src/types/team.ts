export interface Team {
  id: string;
  hackathonId: string;
  name: string;
  ownerId: string;
  status: 'ACTIVE' | 'DISQUALIFIED' | 'LOCKED';
  promotedToStageOrder: number;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'LEAD' | 'MEMBER';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  inviterId: string;
  inviteeId?: string | null;
  email?: string | null;
  username?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  team?: { id: string; name: string };
  inviter?: { id: string; name: string };
  invitee?: { id: string; name: string };
}
