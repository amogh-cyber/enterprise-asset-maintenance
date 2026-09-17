import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPERATIONAL':
    case 'VALIDATED':
    case 'CLOSED':
    case 'APPROVED':
    case 'ACTIVE':
    case 'SUCCESS':
      return <Badge variant="success">{status.replace(/_/g, ' ')}</Badge>;
    case 'UNDER_MAINTENANCE':
    case 'IN_PROGRESS':
    case 'WAITING_FOR_PARTS':
    case 'UNDER_REVIEW':
    case 'PARTIAL_SUCCESS':
      return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;
    case 'OUT_OF_SERVICE':
    case 'RETIRED':
    case 'REJECTED':
    case 'FAILED':
    case 'CRITICAL':
      return <Badge variant="danger">{status.replace(/_/g, ' ')}</Badge>;
    case 'ASSIGNED':
    case 'COMPLETED':
    case 'CONVERTED_TO_WORK_ORDER':
      return <Badge variant="purple">{status.replace(/_/g, ' ')}</Badge>;
    case 'OPEN':
    case 'CREATED':
    case 'HIGH':
      return <Badge variant="info">{status.replace(/_/g, ' ')}</Badge>;
    default:
      return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  }
};
