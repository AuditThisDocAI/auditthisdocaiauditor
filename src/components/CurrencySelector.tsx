import { useState, useRef, useEffect } from 'react';
import { DollarSign, ChevronDown, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency, CURRENCIES, CurrencyCode } from '../lib/currency';

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
}

export function CurrencySelector({ compact = false, className = '' }: CurrencySelectorProps) {
  const { currency, changeCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = CURRENCIES[currency];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-purple-300 hover:bg-slate-50 transition-all cursor-pointer ${
          compact ? 'py-1 px-2.5 text-[11px]' : ''
        }`}
        title="Toggle Currency for Audit Figures & Pricing"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{activeConfig.flag}</span>
          <span className="font-extrabold text-slate-800">{activeConfig.code}</span>
          <span className="text-purple-600 font-mono">({activeConfig.symbol})</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200 z-50 text-slate-800"
          >
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-purple-600" /> Currency Conversion
              </span>
              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" /> Live Rates
              </span>
            </div>

            <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                const item = CURRENCIES[code];
                const isSelected = code === currency;

                return (
                  <button
                    key={code}
                    onClick={() => {
                      changeCurrency(code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.flag}</span>
                      <div className="flex flex-col text-left">
                        <span className="leading-tight text-slate-900 font-bold">{item.code} ({item.symbol})</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.name}</span>
                      </div>
                    </div>
                    
                    {isSelected ? (
                      <Check className="w-4 h-4 text-purple-600" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.rate === 1 ? '1.0x' : `${item.rate}x`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium px-2">
              All financial audits & reports auto-convert to selected currency.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
