import React, { useState } from 'react';
import { Calculator, Percent } from 'lucide-react';
import { useCurrency } from '../lib/currency';

export function TaxCalculator() {
  const { format, currency, currencyConfig } = useCurrency();
  const [amount, setAmount] = useState<string>('1000');
  const [taxRate, setTaxRate] = useState<string>('20');
  const [isInclusive, setIsInclusive] = useState<boolean>(false);

  const parsedAmount = parseFloat(amount) || 0;
  const parsedRate = parseFloat(taxRate) || 0;

  let netAmount = 0;
  let taxAmount = 0;
  let grossAmount = 0;

  if (isInclusive) {
    grossAmount = parsedAmount;
    netAmount = grossAmount / (1 + parsedRate / 100);
    taxAmount = grossAmount - netAmount;
  } else {
    netAmount = parsedAmount;
    taxAmount = netAmount * (parsedRate / 100);
    grossAmount = netAmount + taxAmount;
  }

  // Assuming the user types in their current active currency for simplicity
  // But wait, the currency hook format() method expects USD amount in. 
  // Let's just manually format using the current currency symbol directly to avoid double conversion
  const formatLocal = (val: number) => {
    return `${currencyConfig.symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8 h-full flex flex-col">
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-bold text-[#1E293B]">VAT / Tax Calculator</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
          Tools
        </span>
      </div>
      
      <div className="p-6 flex-grow flex flex-col justify-center space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Amount</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400 font-bold">{currencyConfig.symbol}</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono font-bold text-slate-900 bg-slate-50"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tax Rate (%)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Percent className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono font-bold text-slate-900 bg-slate-50"
              placeholder="20"
            />
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setIsInclusive(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!isInclusive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Exclusive (Add Tax)
          </button>
          <button
            onClick={() => setIsInclusive(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${isInclusive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Inclusive (Extract Tax)
          </button>
        </div>
        
        <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-500">Net Amount:</span>
            <span className="font-bold text-slate-900 font-mono">{formatLocal(netAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-500">Tax Amount ({taxRate}%):</span>
            <span className="font-bold text-blue-600 font-mono">+{formatLocal(taxAmount)}</span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="font-extrabold text-slate-900">Gross Total:</span>
            <span className="text-xl font-black text-slate-900 font-mono">{formatLocal(grossAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
