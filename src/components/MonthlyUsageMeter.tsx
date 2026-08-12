import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  Crown,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { getActiveFirm, getFirmMonthlyUsage, MonthlyUsage } from '../lib/multiTenantDb';

export function MonthlyUsageMeter() {
  const firm = getActiveFirm();
  const [usage, setUsage] = useState<MonthlyUsage>(getFirmMonthlyUsage(firm.id));

  const refreshUsage = () => {
    setUsage(getFirmMonthlyUsage(firm.id));
  };

  useEffect(() => {
    refreshUsage();
    window.addEventListener('firm-usage-updated', refreshUsage);
    return () => window.removeEventListener('firm-usage-updated', refreshUsage);
  }, [firm.id]);

  const percentage = Math.min(100, Math.round((usage.auditsCount / firm.monthlyAuditLimit) * 100));

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Monthly Firm Audit Usage</h4>
            <span className="text-[11px] text-slate-500 font-mono">Billing Cycle: {usage.yearMonth}</span>
          </div>
        </div>

        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          {firm.plan.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end text-xs font-bold">
          <span className="text-slate-600">
            Document Audits Executed: <strong className="text-slate-900 text-sm">{usage.auditsCount}</strong>
          </span>
          <span className="text-slate-500">
            Monthly Quota: <strong className="text-slate-900">{firm.monthlyAuditLimit}</strong>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 ${
              percentage > 85 ? 'bg-amber-500' : 'bg-purple-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>{percentage}% of monthly quota used</span>
          <span>Last audit: {new Date(usage.lastAuditAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
        <span className="text-slate-500 text-[11px]">
          Automated billing telemetry active for {firm.name}
        </span>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }))}
          className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 hover:underline"
        >
          Expand Monthly Quota
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
