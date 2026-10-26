import React from 'react';
import { ComplaintStatus } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = (s: string) => {
    switch (s) {
      case 'Submitted':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Under Review':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'Investigation Started':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      case 'Closed':
        return 'bg-zinc-100 text-zinc-700 border-zinc-300';
      case 'Verified':
        return 'bg-rose-50 text-rose-900 border-rose-300';
      case 'Reported':
        return 'bg-orange-50 text-orange-900 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium uppercase tracking-wider rounded-none border ${sizeClasses} ${getStyles(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
};
