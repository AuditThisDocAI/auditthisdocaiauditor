import { useState, useEffect } from 'react';

export type CurrencyCode = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CAD' 
  | 'AUD' 
  | 'JPY' 
  | 'CHF'
  | 'SGD'
  | 'HKD'
  | 'INR'
  | 'AED'
  | 'ZAR'
  | 'BRL'
  | 'MXN'
  | 'NZD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Conversion rate relative to 1 USD
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'USD - US Dollar', rate: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR - Euro', rate: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'GBP - British Pound', rate: 0.79, flag: '🇬🇧' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'CAD - Canadian Dollar', rate: 1.36, flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'AUD - Australian Dollar', rate: 1.52, flag: '🇦🇺' },
  JPY: { code: 'JPY', symbol: '¥', name: 'JPY - Japanese Yen', rate: 155.0, flag: '🇯🇵' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'CHF - Swiss Franc', rate: 0.90, flag: '🇨🇭' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'SGD - Singapore Dollar', rate: 1.35, flag: '🇸🇬' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'HKD - Hong Kong Dollar', rate: 7.82, flag: '🇭🇰' },
  INR: { code: 'INR', symbol: '₹', name: 'INR - Indian Rupee', rate: 83.5, flag: '🇮🇳' },
  AED: { code: 'AED', symbol: 'AED', name: 'AED - UAE Dirham', rate: 3.67, flag: '🇦🇪' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'ZAR - South African Rand', rate: 18.50, flag: '🇿🇦' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'BRL - Brazilian Real', rate: 5.45, flag: '🇧🇷' },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'MXN - Mexican Peso', rate: 18.20, flag: '🇲🇽' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'NZD - New Zealand Dollar', rate: 1.63, flag: '🇳🇿' },
};

const CURRENCY_STORAGE_KEY = 'audit_app_active_currency';

export function getActiveCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
  if (saved && CURRENCIES[saved]) {
    return saved;
  }
  return 'USD';
}

export function setActiveCurrency(code: CurrencyCode): void {
  if (CURRENCIES[code]) {
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: { currency: code } }));
  }
}

export function convertAmount(amountInUSD: number, targetCurrency?: CurrencyCode): number {
  const code = targetCurrency || getActiveCurrency();
  const config = CURRENCIES[code] || CURRENCIES.USD;
  return amountInUSD * config.rate;
}

export function formatCurrency(
  amountInUSD: number, 
  options: { code?: CurrencyCode; compact?: boolean; hideDecimals?: boolean } = {}
): string {
  const code = options.code || getActiveCurrency();
  const config = CURRENCIES[code] || CURRENCIES.USD;
  const converted = amountInUSD * config.rate;

  if (code === 'JPY') {
    return `${config.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  }

  const decimals = options.hideDecimals ? 0 : (converted % 1 === 0 ? 0 : 2);
  
  if (options.compact && converted >= 1000000) {
    return `${config.symbol}${(converted / 1000000).toFixed(1)}M`;
  }
  if (options.compact && converted >= 1000) {
    return `${config.symbol}${(converted / 1000).toFixed(1)}k`;
  }

  return `${config.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  })}`;
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getActiveCurrency());

  useEffect(() => {
    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ currency: CurrencyCode }>;
      if (customEvent.detail && customEvent.detail.currency) {
        setCurrencyState(customEvent.detail.currency);
      } else {
        setCurrencyState(getActiveCurrency());
      }
    };

    window.addEventListener('currency-changed', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  const changeCurrency = (code: CurrencyCode) => {
    setActiveCurrency(code);
    setCurrencyState(code);
  };

  return {
    currency,
    currencyConfig: CURRENCIES[currency],
    changeCurrency,
    format: (amountUSD: number, options?: { compact?: boolean; hideDecimals?: boolean }) =>
      formatCurrency(amountUSD, { code: currency, ...options }),
    convert: (amountUSD: number) => convertAmount(amountUSD, currency),
  };
}

/**
 * Parses numeric amount from string like "$1,250.50", "EUR 450", "12499.00 USD"
 */
export function parseAmountNumber(amountStr?: string | null): number | null {
  if (!amountStr) return null;
  // Remove currency symbols, commas, extra letters except dot and digits
  const clean = amountStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats a detected document amount into the active or given currency with code badge
 */
export function formatAuditAmount(
  amount: number | string | null | undefined,
  targetCurrency?: CurrencyCode
): { formatted: string; code: string; symbol: string } {
  const code = targetCurrency || getActiveCurrency();
  const config = CURRENCIES[code] || CURRENCIES.USD;
  
  if (amount === null || amount === undefined || amount === '') {
    return { formatted: 'N/A', code: config.code, symbol: config.symbol };
  }
  
  const num = typeof amount === 'number' ? amount : parseAmountNumber(amount);
  if (num === null) {
    return { formatted: String(amount), code: config.code, symbol: config.symbol };
  }
  
  const converted = num * (config.rate || 1.0);
  const formatted = `${config.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  
  return { formatted, code: config.code, symbol: config.symbol };
}
