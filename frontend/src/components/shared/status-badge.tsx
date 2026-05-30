import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'; label: string }> = {
  DRAFT: { variant: 'neutral', label: 'Draft' },
  PUBLISHED: { variant: 'info', label: 'Published' },
  ONGOING: { variant: 'success', label: 'Live' },
  COMPLETED: { variant: 'accent', label: 'Completed' },
  ARCHIVED: { variant: 'neutral', label: 'Archived' },
  PENDING_PAYMENT: { variant: 'warning', label: 'Pending Payment' },
  PENDING_APPROVAL: { variant: 'warning', label: 'Pending Approval' },
  APPROVED: { variant: 'success', label: 'Approved' },
  REJECTED: { variant: 'error', label: 'Rejected' },
  CANCELLED: { variant: 'neutral', label: 'Cancelled' },
  SUBMITTED: { variant: 'info', label: 'Submitted' },
  LOCKED: { variant: 'accent', label: 'Locked' },
  ACTIVE: { variant: 'success', label: 'Active' },
  DISQUALIFIED: { variant: 'error', label: 'Disqualified' },
  PENDING: { variant: 'warning', label: 'Pending' },
  SUCCESS: { variant: 'success', label: 'Success' },
  FAILED: { variant: 'error', label: 'Failed' },
  REFUNDED: { variant: 'neutral', label: 'Refunded' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusMap[status] || { variant: 'neutral' as const, label: status };
  return (
    <Badge variant={config.variant} size="sm">
      {customLabel || config.label}
    </Badge>
  );
}
