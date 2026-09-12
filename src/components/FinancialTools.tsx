import React from 'react';
import { CurrencyConverter } from './CurrencyConverter';
import { TaxCalculator } from './TaxCalculator';
import { Calculator, ArrowRightLeft } from 'lucide-react';

export function FinancialTools() {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1E293B] tracking-tight">Financial Tools</h2>
          <p className="text-sm font-semibold text-[#64748B]">Real-time calculators & currency conversion</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CurrencyConverter />
        <TaxCalculator />
      </div>
    </div>
  );
}
