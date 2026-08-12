import { useState, useEffect } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

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
