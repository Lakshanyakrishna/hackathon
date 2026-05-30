export interface Registration {
  id: string;
  userId: string;
  hackathonId: string;
  teamId?: string | null;
  status: 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedAt?: string | null;
  approvedBy?: string | null;
  registeredAt: string;
  payment?: {
    id: string;
    status: string;
    amount: string;
  } | null;
  hackathon?: {
    id: string;
    title: string;
    slug: string;
  };
  team?: {
    id: string;
    name: string;
  };
}
