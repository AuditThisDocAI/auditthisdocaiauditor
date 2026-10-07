import React, { useState } from 'react';
import { RefreshCw, ArrowRightLeft, DollarSign } from 'lucide-react';
import { CURRENCIES, CurrencyCode } from '../lib/currency';
import { motion } from 'motion/react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('EUR');

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const parsedAmount = parseFloat(amount) || 0;
  
  // Calculate converted amount
  // Convert from 'fromCurrency' to USD, then from USD to 'toCurrency'
  const fromRate = CURRENCIES[fromCurrency].rate;
  const toRate = CURRENCIES[toCurrency].rate;
  
  const amountInUSD = parsedAmount / fromRate;
  const convertedAmount = amountInUSD * toRate;

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8 h-full flex flex-col">
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-bold text-[#1E293B]">Live Currency Converter</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
          Rates
        </span>
      </div>
      
      <div className="p-6 flex-grow flex flex-col justify-center">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">{CURRENCIES[fromCurrency].symbol}</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono font-bold text-slate-900 bg-slate-50"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
                className="block w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-bold text-slate-900 bg-slate-50 appearance-none cursor-pointer"
              >
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <option key={code} value={code}>
                    {CURRENCIES[code].flag} {code} - {CURRENCIES[code].name.split(' - ')[1]}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col items-center justify-end h-full pt-6">
              <button
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                title="Swap Currencies"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
                className="block w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-bold text-slate-900 bg-slate-50 appearance-none cursor-pointer"
              >
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <option key={code} value={code}>
                    {CURRENCIES[code].flag} {code} - {CURRENCIES[code].name.split(' - ')[1]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-emerald-50 rounded-2xl p-5 text-center border border-emerald-100">
          <div className="text-xs font-semibold text-emerald-600 mb-1">
            {parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromCurrency} =
          </div>
          <div className="text-3xl font-black text-emerald-900 tracking-tight">
            {CURRENCIES[toCurrency].symbol}{convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl font-bold text-emerald-700">{toCurrency}</span>
          </div>
          <div className="text-xs text-emerald-600/80 font-medium mt-1">
            Exchange Baseline: 1 {fromCurrency} = {(toRate / fromRate).toFixed(4)} {toCurrency}
          </div>

          {/* Quick Apply as Global Audit Currency */}
          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-emerald-800 font-medium text-left">
              Apply <span className="font-bold">{CURRENCIES[toCurrency].code} ({CURRENCIES[toCurrency].symbol})</span> to all page scans & audits:
            </span>
            <button
              onClick={() => {
                import('../lib/currency').then(m => m.setActiveCurrency(toCurrency));
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{CURRENCIES[toCurrency].flag}</span>
              <span>Set as Global Page Currency</span>
            </button>
          </div>
        </div>

        {/* Quick Audit Presets */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Quick Audit Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[150, 500, 1500, 5000, 25000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(String(preset))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                {CURRENCIES[fromCurrency].symbol}{preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
