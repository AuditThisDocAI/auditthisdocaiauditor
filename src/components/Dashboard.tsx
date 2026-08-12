import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, Activity, FileText } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { name: 'Total Audits', value: '1,284', change: '+12.5%', icon: FileText },
    { name: 'Active Users', value: '45', change: '+3.2%', icon: Users },
    { name: 'Fraud Detected', value: '23', change: '-5.1%', icon: Activity },
    { name: 'System Health', value: '99.9%', change: '0.0%', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#E2E8F0]">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">App Dashboard</h2>
            <p className="text-[#64748B] text-sm mt-1">Overview of system metrics and recent activity.</p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
            className="bg-[#F8F9FC] hover:bg-[#E2E8F0] text-[#1E293B] px-5 py-2.5 rounded-xl font-medium transition-all"
          >
            Back to Portal
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-green-500' : stat.change.startsWith('-') ? 'text-red-500' : 'text-gray-500'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-[#64748B] font-medium text-sm">{stat.name}</h3>
                <p className="text-3xl font-bold text-[#1E293B] mt-1">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
            <h3 className="text-[#1E293B] font-bold text-lg">Charts & Analytics</h3>
            <p className="text-[#64748B] text-sm mt-2">More detailed analytics components can be added here.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
