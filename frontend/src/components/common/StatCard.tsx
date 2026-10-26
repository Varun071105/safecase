import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] p-5 shadow-none transition-colors hover:border-[#CBD5E1]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 bg-[#F4F6F8] text-[#0C2038]">
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
          {value}
        </span>
        {badgeText && (
          <span className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-[#64748B] truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
