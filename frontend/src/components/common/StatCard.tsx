import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  badge,
  color = 'blue',
}) => {
  const iconColors = {
    blue: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg border ${iconColors[color]}`}>{icon}</div>
    </div>
  );
};
